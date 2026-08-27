import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MediumAdapter } from "./adapter";
import { mapMediumArticle } from "./mapper";
import { normalizeMediumError } from "./errors";
import { mediumCapabilities, mediumPermissions } from "./capabilities";

describe("Medium Capabilities & Permissions", () => {
  it("should have correct article publishing capabilities", () => {
    assert.equal(mediumCapabilities.supports_article, true);
    assert.equal(mediumCapabilities.publish_enabled, true);
    assert.equal(mediumCapabilities.max_tags, 5);
    assert.ok(mediumPermissions.includes("publishPost"));
  });
});

describe("Medium Article Mapper", () => {
  it("should fail when title is missing", () => {
    assert.throws(
      () =>
        mapMediumArticle({
          accessToken: "medium_token",
          content: { body: "Article content without title" },
        }),
      /Medium story requires a title/
    );
  });

  it("should fail when body content is missing", () => {
    assert.throws(
      () =>
        mapMediumArticle({
          accessToken: "medium_token",
          content: { title: "Title Only" },
        }),
      /Medium story requires non-empty body content/
    );
  });

  it("should map article and embed media URL as cover image", () => {
    const mapped = mapMediumArticle({
      accessToken: "medium_token",
      content: {
        title: "Building Microservices in 2026",
        body: "## Introduction\nMicroservices architecture has evolved significantly...",
        tags: ["programming", "cloud", "architecture", "microservices", "tech", "extra-tag"],
        publishStatus: "draft",
      },
      media: {
        storagePath: "/banner.png",
        mimeType: "image/png",
        url: "https://example.com/banner.png",
      },
    });

    assert.equal(mapped.title, "Building Microservices in 2026");
    assert.ok(mapped.content.startsWith("![Cover Image](https://example.com/banner.png)"));
    assert.equal(mapped.tags?.length, 5); // Enforces max 5 tags limit
    assert.equal(mapped.publishStatus, "draft");
  });
});

describe("Medium Error Normalization", () => {
  it("should normalize Medium error code 6000 (invalid token)", () => {
    const err = normalizeMediumError({
      errors: [{ message: "Token was revoked.", code: 6000 }],
    });
    assert.equal(err.code, "PLATFORM_AUTH_ERROR");
  });

  it("should normalize Medium error code 6013 (invalid content)", () => {
    const err = normalizeMediumError({
      errors: [{ message: "Content length exceeds maximum limit.", code: 6013 }],
    });
    assert.equal(err.code, "INVALID_CONTENT");
  });
});

describe("Medium Adapter Publishing Flow (Mocked Network)", () => {
  const originalFetch = globalThis.fetch;

  it("should create article post and return confirmed URL", async () => {
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/v1/me")) {
        return new Response(
          JSON.stringify({
            data: { id: "user_med_12345", username: "developer_author", name: "Dev Author" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/posts")) {
        return new Response(
          JSON.stringify({
            data: {
              id: "med_post_987654",
              title: "Building Microservices",
              url: "https://medium.com/@developer_author/building-microservices-987654",
              publishStatus: "public",
            },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    };

    try {
      const adapter = new MediumAdapter();
      const result = await adapter.publish({
        accessToken: "medium_valid_token",
        content: {
          title: "Building Microservices",
          body: "Complete article body...",
        },
      });

      assert.equal(result.confirmed, true);
      assert.equal(result.externalPostId, "med_post_987654");
      assert.equal(result.externalUrl, "https://medium.com/@developer_author/building-microservices-987654");
      assert.equal(result.statusCode, 201);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
