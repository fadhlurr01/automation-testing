import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InstagramAdapter } from "./adapter";
import { mapInstagramMedia } from "./mapper";
import { normalizeInstagramError } from "./errors";
import { instagramCapabilities, instagramPermissions } from "./capabilities";

describe("Instagram Platform Capabilities & Permissions", () => {
  it("should have correct capabilities for image and reels publishing", () => {
    assert.equal(instagramCapabilities.supports_image, true);
    assert.equal(instagramCapabilities.supports_video, true);
    assert.equal(instagramCapabilities.supports_article, false);
    assert.equal(instagramCapabilities.publish_enabled, true);
    assert.equal(instagramCapabilities.max_caption_length, 2200);
    assert.ok(instagramPermissions.includes("instagram_business_content_publish"));
    assert.ok(instagramPermissions.includes("instagram_business_basic"));
  });
});

describe("Instagram Media Mapper", () => {
  it("should fail when accountId is missing", () => {
    assert.throws(
      () =>
        mapInstagramMedia({
          accessToken: "EAAB...",
          content: { caption: "Test post" },
          media: { storagePath: "/img.jpg", mimeType: "image/jpeg", url: "https://example.com/img.jpg" },
        }),
      /Instagram Professional account ID is required/
    );
  });

  it("should fail when media URL is missing or not HTTP/HTTPS", () => {
    assert.throws(
      () =>
        mapInstagramMedia({
          accessToken: "EAAB...",
          accountId: "17841400000000000",
          content: { caption: "Test post" },
          media: { storagePath: "/img.jpg", mimeType: "image/jpeg" },
        }),
      /Instagram API requires a publicly accessible HTTPS media URL/
    );

    assert.throws(
      () =>
        mapInstagramMedia({
          accessToken: "EAAB...",
          accountId: "17841400000000000",
          content: { caption: "Test post" },
          media: { storagePath: "/img.jpg", mimeType: "image/jpeg", url: "ftp://example.com/img.jpg" },
        }),
      /Instagram media URL must be a valid HTTP\/HTTPS URL/
    );
  });

  it("should map image post properly", () => {
    const mapped = mapInstagramMedia({
      accessToken: "EAAB...",
      accountId: "17841400000000000",
      content: { caption: "Beautiful sunset #nature", alt_text: "A vibrant sunset over the sea" },
      media: { storagePath: "/sunset.jpg", mimeType: "image/jpeg", url: "https://example.com/sunset.jpg" },
    });

    assert.equal(mapped.accountId, "17841400000000000");
    assert.equal(mapped.mediaType, "IMAGE");
    assert.equal(mapped.mediaUrl, "https://example.com/sunset.jpg");
    assert.equal(mapped.caption, "Beautiful sunset #nature");
    assert.equal(mapped.altText, "A vibrant sunset over the sea");
  });

  it("should map video / reels post properly", () => {
    const mapped = mapInstagramMedia({
      accessToken: "EAAB...",
      accountId: "17841400000000000",
      content: { caption: "Check out this reel! #automation" },
      media: { storagePath: "/clip.mp4", mimeType: "video/mp4", url: "https://example.com/clip.mp4" },
    });

    assert.equal(mapped.accountId, "17841400000000000");
    assert.equal(mapped.mediaType, "REELS");
    assert.equal(mapped.mediaUrl, "https://example.com/clip.mp4");
  });

  it("should reject caption exceeding 2200 chars", () => {
    const longCaption = "a".repeat(2201);
    assert.throws(
      () =>
        mapInstagramMedia({
          accessToken: "EAAB...",
          accountId: "17841400000000000",
          content: { caption: longCaption },
          media: { storagePath: "/img.jpg", mimeType: "image/jpeg", url: "https://example.com/img.jpg" },
        }),
      /Caption exceeds Instagram maximum length/
    );
  });
});

describe("Instagram Error Normalization", () => {
  it("should normalize Meta OAuth / expired token code 190", () => {
    const normalized = normalizeInstagramError({
      error: {
        message: "Error validating access token: Session has expired",
        type: "OAuthException",
        code: 190,
        error_subcode: 463,
      },
    });

    assert.equal(normalized.code, "PLATFORM_AUTH_ERROR");
    assert.equal(normalized.retryable, false);
  });

  it("should normalize Meta rate limit code 4 / 32 / 613", () => {
    const normalized = normalizeInstagramError({
      error: {
        message: "User request limit reached",
        type: "OAuthException",
        code: 17,
      },
    });

    assert.equal(normalized.code, "PLATFORM_RATE_LIMIT");
    assert.equal(normalized.retryable, true);
  });

  it("should normalize Meta media invalid aspect ratio error", () => {
    const normalized = normalizeInstagramError({
      error: {
        message: "The image aspect ratio is not supported",
        type: "OAuthException",
        code: 352,
      },
    });

    assert.equal(normalized.code, "INVALID_MEDIA");
    assert.equal(normalized.retryable, false);
  });

  it("should normalize transient Meta server error", () => {
    const normalized = normalizeInstagramError({
      error: {
        message: "Please reduce the amount of data you're asking for",
        type: "OAuthException",
        code: 2,
        is_transient: true,
      },
    });

    assert.equal(normalized.code, "PLATFORM_UNAVAILABLE");
    assert.equal(normalized.retryable, true);
  });
});

describe("Instagram Adapter Controlled Publishing Flow (Mocked Network)", () => {
  const originalFetch = globalThis.fetch;

  it("should complete the full image publishing lifecycle and retrieve permalink", async () => {
    const mockResponses: Record<string, unknown> = {
      media_container: { id: "17900112233445566" },
      media_publish: { id: "18000998877665544" },
      post_details: {
        id: "18000998877665544",
        permalink: "https://www.instagram.com/p/DFxyz123/",
        media_type: "IMAGE",
        timestamp: "2026-08-27T10:00:00+0000",
      },
    };

    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/media_publish")) {
        return new Response(JSON.stringify(mockResponses.media_publish), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("/media")) {
        return new Response(JSON.stringify(mockResponses.media_container), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("18000998877665544")) {
        return new Response(JSON.stringify(mockResponses.post_details), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    };

    try {
      const adapter = new InstagramAdapter();
      const result = await adapter.publish({
        accessToken: "EAABmockAccessToken123",
        accountId: "17841400000000000",
        content: { caption: "Production test post #automation" },
        media: {
          storagePath: "/test.jpg",
          mimeType: "image/jpeg",
          url: "https://storage.googleapis.com/test-bucket/test.jpg",
        },
      });

      assert.equal(result.confirmed, true);
      assert.equal(result.externalPostId, "18000998877665544");
      assert.equal(result.externalUrl, "https://www.instagram.com/p/DFxyz123/");
      assert.equal(result.statusCode, 200);

      // Verify step
      const verified = await adapter.verify(result, "EAABmockAccessToken123");
      assert.equal(verified, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("should fail gracefully and normalize error when container creation fails", async () => {
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          error: {
            message: "Invalid OAuth access token - Cannot parse access token",
            type: "OAuthException",
            code: 190,
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    };

    try {
      const adapter = new InstagramAdapter();
      await assert.rejects(
        async () => {
          await adapter.publish({
            accessToken: "invalid_token",
            accountId: "17841400000000000",
            content: { caption: "Test" },
            media: {
              storagePath: "/test.jpg",
              mimeType: "image/jpeg",
              url: "https://example.com/test.jpg",
            },
          });
        },
        (err: Error & { code?: string }) => {
          assert.equal(err.code, "PLATFORM_AUTH_ERROR");
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
