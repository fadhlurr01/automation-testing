import type { PlatformAdapter, PublishRequest, PublishResult } from "@/lib/publishing/types";
import { mapMediumArticle } from "./mapper";
import { normalizeMediumError } from "./errors";

const apiBase = "https://api.medium.com/v1";

async function parseResponse(response: Response): Promise<Record<string, unknown>> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw normalizeMediumError(body);
  }
  return body as Record<string, unknown>;
}

export class MediumAdapter implements PlatformAdapter {
  /**
   * Official Medium Publishing Flow:
   * 1. Validate connection
   * 2. Obtain user author ID via GET /v1/me if not specified in request
   * 3. POST /v1/users/{authorId}/posts with title, contentFormat, content, tags, publishStatus
   * 4. Confirm published article id and URL
   */
  async publish(request: PublishRequest): Promise<PublishResult> {
    if (!request.accessToken || request.accessToken.trim() === "") {
      throw normalizeMediumError(new Error("Medium access token is required."));
    }

    const mapped = mapMediumArticle(request);
    let authorId = mapped.authorId;

    if (!authorId) {
      const meResponse = await fetch(`${apiBase}/me`, {
        headers: {
          Authorization: `Bearer ${request.accessToken}`,
          Accept: "application/json",
        },
      });
      const meData = await parseResponse(meResponse);
      const user = (meData.data || {}) as Record<string, unknown>;
      authorId = String(user.id || "");
    }

    if (!authorId) {
      throw normalizeMediumError(new Error("Medium author ID could not be determined."));
    }

    const payload: Record<string, unknown> = {
      title: mapped.title,
      contentFormat: mapped.contentFormat,
      content: mapped.content,
      publishStatus: mapped.publishStatus,
    };

    if (mapped.tags && mapped.tags.length > 0) payload.tags = mapped.tags;
    if (mapped.canonicalUrl) payload.canonicalUrl = mapped.canonicalUrl;

    const response = await fetch(`${apiBase}/users/${encodeURIComponent(authorId)}/posts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${request.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const body = await parseResponse(response);
    const postData = (body.data || body) as Record<string, unknown>;
    const postId = typeof postData.id === "string" ? postData.id : "";
    const url = typeof postData.url === "string" ? postData.url : undefined;

    if (!postId) {
      throw normalizeMediumError(new Error("Medium did not confirm a published post ID."));
    }

    return {
      confirmed: true,
      externalPostId: postId,
      externalUrl: url,
      statusCode: response.status,
      responseMetadata: {
        authorId,
        postId,
        publishStatus: mapped.publishStatus,
        url,
      },
    };
  }

  async verify(result: PublishResult, _accessToken: string): Promise<boolean> {
    if (!result.confirmed || !result.externalPostId) {
      return false;
    }
    return Boolean(result.externalPostId);
  }

  async testConnection(accessToken: string): Promise<{ ok: boolean; accountName?: string; username?: string; error?: string }> {
    try {
      const response = await fetch(`${apiBase}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      const result = await parseResponse(response);
      const data = (result.data || {}) as Record<string, unknown>;

      const username = typeof data.username === "string" ? data.username : undefined;
      const accountName = typeof data.name === "string" ? data.name : username || "Medium Author";

      return {
        ok: true,
        accountName,
        username,
      };
    } catch (error) {
      const normalized = normalizeMediumError(error);
      return {
        ok: false,
        error: `${normalized.code}: ${normalized.message}`,
      };
    }
  }
}
