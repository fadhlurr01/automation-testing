import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ImgboxAdapter } from "./adapter";
import { mapImgboxUpload } from "./mapper";
import { normalizeImgboxError } from "./errors";
import { imgboxCapabilities } from "./capabilities";

describe("Imgbox Capabilities", () => {
  it("should have correct hosting capabilities", () => {
    assert.equal(imgboxCapabilities.supports_image, true);
    assert.equal(imgboxCapabilities.supports_video, false);
    assert.equal(imgboxCapabilities.publish_enabled, true);
    assert.equal(imgboxCapabilities.max_file_size_bytes, 10485760);
  });
});

describe("Imgbox Mapper", () => {
  it("should fail when media is missing", () => {
    assert.throws(
      () =>
        mapImgboxUpload({
          accessToken: "",
          content: {},
        }),
      /Imgbox upload requires a media URL or storage path/
    );
  });

  it("should fail on unsupported mime type", () => {
    assert.throws(
      () =>
        mapImgboxUpload({
          accessToken: "",
          content: {},
          media: {
            storagePath: "/doc.pdf",
            mimeType: "application/pdf",
            url: "https://example.com/doc.pdf",
          },
        }),
      /Unsupported image type/
    );
  });

  it("should map valid image upload payload", () => {
    const mapped = mapImgboxUpload({
      accessToken: "",
      content: { title: "My Vacation" },
      media: {
        storagePath: "/vacation.jpg",
        mimeType: "image/jpeg",
        url: "https://example.com/vacation.jpg",
      },
    });

    assert.equal(mapped.imageUrl, "https://example.com/vacation.jpg");
    assert.equal(mapped.mimeType, "image/jpeg");
    assert.equal(mapped.galleryTitle, "My Vacation");
  });
});

describe("Imgbox Error Normalization", () => {
  it("should map size limit errors to INVALID_MEDIA", () => {
    const err = normalizeImgboxError("File size exceeds the 10MB limit");
    assert.equal(err.code, "INVALID_MEDIA");
  });

  it("should map service offline errors to PLATFORM_UNAVAILABLE", () => {
    const err = normalizeImgboxError("Imgbox service is temporarily offline (503)");
    assert.equal(err.code, "PLATFORM_UNAVAILABLE");
    assert.equal(err.retryable, true);
  });
});

describe("Imgbox Adapter Upload Flow (Mocked Network)", () => {
  const originalFetch = globalThis.fetch;

  it("should upload image and return confirmed direct URL", async () => {
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("example.com/sample.jpg")) {
        return new Response(new Uint8Array([0xff, 0xd8, 0xff]), {
          status: 200,
          headers: { "Content-Type": "image/jpeg" },
        });
      }
      if (url.includes("imgbox.com/upload/process")) {
        return new Response(
          JSON.stringify({
            success: true,
            files: [
              {
                id: "img_abc123",
                url: "https://imgbox.com/abc123view",
                original_url: "https://images2.imgbox.com/8f/12/abc123_o.jpg",
                thumbnail_url: "https://thumbs2.imgbox.com/8f/12/abc123_t.jpg",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(null, { status: 200 });
    };

    try {
      const adapter = new ImgboxAdapter();
      const result = await adapter.publish({
        accessToken: "",
        content: { title: "Sample Picture" },
        media: {
          storagePath: "/sample.jpg",
          mimeType: "image/jpeg",
          url: "https://example.com/sample.jpg",
        },
      });

      assert.equal(result.confirmed, true);
      assert.equal(result.externalPostId, "img_abc123");
      assert.equal(result.externalUrl, "https://images2.imgbox.com/8f/12/abc123_o.jpg");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
