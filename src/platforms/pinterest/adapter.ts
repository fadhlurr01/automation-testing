import type { PlatformAdapter, PublishRequest, PublishResult } from "@/lib/publishing/types";
import { mapPinterestPin } from "./mapper";
import { normalizePinterestError } from "./errors";

const apiBase = "https://api.pinterest.com/v5";

async function parseResponse(response: Response): Promise<Record<string, unknown>> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw normalizePinterestError(body);
  }
  return body as Record<string, unknown>;
}

export class PinterestAdapter implements PlatformAdapter {
  /**
   * Official Pinterest API v5 Pin Publishing Flow:
   * 1. Validate connection and pin metadata
   * 2. POST /v5/pins with media source image_url
   * 3. Confirm pin id and view link
   */
  async publish(request: PublishRequest): Promise<PublishResult> {
    if (!request.accessToken || request.accessToken.trim() === "") {
      throw normalizePinterestError(new Error("Pinterest OAuth access token is required."));
    }

    const mapped = mapPinterestPin(request);

    const payload: Record<string, unknown> = {
      board_id: mapped.boardId,
      media_source: {
        source_type: "image_url",
        url: mapped.mediaUrl,
      },
    };

    if (mapped.title) payload.title = mapped.title;
    if (mapped.description) payload.description = mapped.description;
    if (mapped.link) payload.link = mapped.link;
    if (mapped.altText) payload.alt_text = mapped.altText;

    const response = await fetch(`${apiBase}/pins`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${request.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await parseResponse(response);
    const pinId = typeof data.id === "string" ? data.id : "";

    if (!pinId) {
      throw normalizePinterestError(new Error("Pinterest did not return a valid Pin ID."));
    }

    const externalUrl = typeof data.link === "string" ? data.link : `https://www.pinterest.com/pin/${pinId}/`;

    return {
      confirmed: true,
      externalPostId: pinId,
      externalUrl,
      statusCode: response.status,
      responseMetadata: {
        boardId: mapped.boardId,
        pinId,
        title: mapped.title,
      },
    };
  }

  async verify(result: PublishResult, accessToken: string): Promise<boolean> {
    if (!result.confirmed || !result.externalPostId) {
      return false;
    }

    try {
      const response = await fetch(`${apiBase}/pins/${encodeURIComponent(result.externalPostId)}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) return false;
      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      return Boolean(data.id);
    } catch {
      return false;
    }
  }

  async testConnection(accessToken: string): Promise<{ ok: boolean; accountName?: string; username?: string; error?: string }> {
    try {
      const response = await fetch(`${apiBase}/user_account`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await parseResponse(response);
      const username = typeof data.username === "string" ? data.username : undefined;
      const accountName = typeof data.business_name === "string" ? data.business_name : username || "Pinterest Account";

      return {
        ok: true,
        accountName,
        username,
      };
    } catch (error) {
      const normalized = normalizePinterestError(error);
      return {
        ok: false,
        error: `${normalized.code}: ${normalized.message}`,
      };
    }
  }
}
