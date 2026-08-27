import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PinterestAdapter } from "./adapter";
import { mapPinterestPin } from "./mapper";
import { normalizePinterestError } from "./errors";
import { pinterestCapabilities, pinterestPermissions } from "./capabilities";

describe("Pinterest Platform Capabilities & Permissions", () => {
  it("should have correct capabilities for pin publishing", () => {
    assert.equal(pinterestCapabilities.supports_image, true);
    assert.equal(pinterestCapabilities.supports_link, true);
    assert.equal(pinterestCapabilities.publish_enabled, true);
    assert.equal(pinterestCapabilities.max_title_length, 100);
    assert.equal(pinterestCapabilities.max_description_length, 500);
    assert.ok(pinterestPermissions.includes("pins:write"));
    assert.ok(pinterestPermissions.includes("boards:read"));
  });
});

describe("Pinterest Pin Mapper", () => {
  it("should fail when media URL is missing", () => {
    assert.throws(
      () =>
        mapPinterestPin({
          accessToken: "pina_test",
          content: { board_id: "123456" },
        }),
      /Pinterest Pin creation requires a valid media URL/
    );
  });

  it("should fail when board_id is missing", () => {
    assert.throws(
      () =>
        mapPinterestPin({
          accessToken: "pina_test",
          content: { title: "Test Pin" },
          media: { storagePath: "/pin.jpg", mimeType: "image/jpeg", url: "https://example.com/pin.jpg" },
        }),
      /Pinterest requires a destination board_id/
    );
  });

  it("should map pin payload and truncate long titles", () => {
    const longTitle = "T".repeat(120);
    const mapped = mapPinterestPin({
      accessToken: "pina_test",
      content: {
        board_id: "8899776655",
        title: longTitle,
        description: "A great pin description with #keywords",
        link: "https://mysite.com/product",
      },
      media: { storagePath: "/pin.jpg", mimeType: "image/jpeg", url: "https://example.com/pin.jpg" },
    });

    assert.equal(mapped.boardId, "8899776655");
    assert.equal(mapped.title?.length, 100);
    assert.equal(mapped.description, "A great pin description with #keywords");
    assert.equal(mapped.link, "https://mysite.com/product");
    assert.equal(mapped.mediaUrl, "https://example.com/pin.jpg");
    assert.equal(mapped.mediaType, "image");
  });
});

describe("Pinterest Error Normalization", () => {
  it("should map 401 unauthorized to PLATFORM_AUTH_ERROR", () => {
    const err = normalizePinterestError({
      code: 401,
      message: "Authorization failed: Token invalid or expired",
    });
    assert.equal(err.code, "PLATFORM_AUTH_ERROR");
    assert.equal(err.retryable, false);
  });

  it("should map 429 rate limit to PLATFORM_RATE_LIMIT", () => {
    const err = normalizePinterestError({
      code: 429,
      message: "Rate limit exceeded",
    });
    assert.equal(err.code, "PLATFORM_RATE_LIMIT");
    assert.equal(err.retryable, true);
  });
});

describe("Pinterest Adapter Controlled Publishing Flow (Mocked Network)", () => {
  const originalFetch = globalThis.fetch;

  it("should create pin successfully and return confirmed link", async () => {
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/pins/1122334455")) {
        return new Response(JSON.stringify({ id: "1122334455" }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url.includes("/pins")) {
        return new Response(
          JSON.stringify({
            id: "1122334455",
            link: "https://www.pinterest.com/pin/1122334455/",
            title: "Test Pin",
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    };

    try {
      const adapter = new PinterestAdapter();
      const result = await adapter.publish({
        accessToken: "pina_valid_token",
        content: {
          board_id: "8899776655",
          title: "Test Pin",
          description: "My pin description",
        },
        media: {
          storagePath: "/pin.jpg",
          mimeType: "image/jpeg",
          url: "https://example.com/pin.jpg",
        },
      });

      assert.equal(result.confirmed, true);
      assert.equal(result.externalPostId, "1122334455");
      assert.equal(result.externalUrl, "https://www.pinterest.com/pin/1122334455/");

      const verified = await adapter.verify(result, "pina_valid_token");
      assert.equal(verified, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
