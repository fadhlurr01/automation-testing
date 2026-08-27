import type { PlatformAdapter, PublishRequest, PublishResult } from "@/lib/publishing/types";
import { mapInstagramMedia } from "./mapper";
import { normalizeInstagramError } from "./errors";

const graphBase = "https://graph.instagram.com";

function getApiVersion(): string {
  return process.env.META_GRAPH_API_VERSION || "v25.0";
}

async function parseResponse(response: Response): Promise<Record<string, unknown>> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw normalizeInstagramError(body);
  }
  return body as Record<string, unknown>;
}

export class InstagramAdapter implements PlatformAdapter {
  /**
   * Complete official Meta Content Publishing flow:
   * 1. Validate connection and media payload
   * 2. Create Instagram media container
   * 3. Poll container processing status until FINISHED (for video/reels or async processing)
   * 4. Publish media container
   * 5. Retrieve confirmed post info and permalink URL
   */
  async publish(request: PublishRequest): Promise<PublishResult> {
    if (!request.accessToken || request.accessToken.trim() === "") {
      throw normalizeInstagramError(new Error("Valid Instagram OAuth access token is required."));
    }

    const mapped = mapInstagramMedia(request);
    const version = getApiVersion();

    // Step 1: Create Media Container
    const containerParams = new URLSearchParams({
      access_token: request.accessToken,
    });

    if (mapped.caption) {
      containerParams.set("caption", mapped.caption);
    }

    if (mapped.mediaType === "REELS" || mapped.mediaType === "VIDEO") {
      containerParams.set("media_type", "REELS");
      containerParams.set("video_url", mapped.mediaUrl);
      containerParams.set("share_to_feed", mapped.shareToFeed ? "true" : "false");
    } else {
      containerParams.set("image_url", mapped.mediaUrl);
      if (mapped.altText) {
        containerParams.set("alt_text", mapped.altText);
      }
    }

    const containerUrl = `${graphBase}/${version}/${encodeURIComponent(mapped.accountId)}/media`;
    const containerResponse = await fetch(containerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: containerParams,
    });

    const containerData = await parseResponse(containerResponse);
    const containerId = typeof containerData.id === "string" ? containerData.id : "";

    if (!containerId) {
      throw normalizeInstagramError(new Error("Instagram did not return a valid media container ID."));
    }

    // Step 2: For async/video processing, wait for container status to be FINISHED
    if (mapped.mediaType === "REELS" || mapped.mediaType === "VIDEO") {
      await this.waitForContainer(containerId, request.accessToken);
    }

    // Step 3: Publish the container
    const publishUrl = `${graphBase}/${version}/${encodeURIComponent(mapped.accountId)}/media_publish`;
    const publishResponse = await fetch(publishUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: request.accessToken,
      }),
    });

    const publishedData = await parseResponse(publishResponse);
    const postId = typeof publishedData.id === "string" ? publishedData.id : "";

    if (!postId) {
      throw normalizeInstagramError(new Error("Instagram did not confirm a published media ID."));
    }

    // Step 4: Retrieve confirmed post details & permalink URL
    let externalUrl: string | undefined;
    try {
      const detailsUrl = `${graphBase}/${version}/${encodeURIComponent(postId)}?fields=id,permalink,media_type,timestamp&access_token=${encodeURIComponent(request.accessToken)}`;
      const detailsResponse = await fetch(detailsUrl);
      if (detailsResponse.ok) {
        const details = (await detailsResponse.json().catch(() => ({}))) as Record<string, unknown>;
        if (typeof details.permalink === "string") {
          externalUrl = details.permalink;
        }
      }
    } catch {
      // Non-fatal if details retrieval fails; post is already published with postId
    }

    return {
      confirmed: true,
      externalPostId: postId,
      externalUrl,
      statusCode: publishResponse.status,
      responseMetadata: {
        containerId,
        mediaType: mapped.mediaType,
        permalink: externalUrl,
      },
    };
  }

  /**
   * Verifies that a published Instagram media item exists and is accessible.
   */
  async verify(result: PublishResult, accessToken: string): Promise<boolean> {
    if (!result.confirmed || !result.externalPostId) {
      return false;
    }

    try {
      const version = getApiVersion();
      const response = await fetch(
        `${graphBase}/${version}/${encodeURIComponent(result.externalPostId)}?fields=id,status&access_token=${encodeURIComponent(accessToken)}`
      );
      if (!response.ok) return false;
      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      return Boolean(data.id);
    } catch {
      return false;
    }
  }

  /**
   * Tests the connection with Instagram credentials.
   */
  async testConnection(accessToken: string, accountId?: string): Promise<{ ok: boolean; accountName?: string; username?: string; error?: string }> {
    try {
      const version = getApiVersion();
      const endpoint = accountId
        ? `${graphBase}/${version}/${encodeURIComponent(accountId)}?fields=id,username,name&access_token=${encodeURIComponent(accessToken)}`
        : `${graphBase}/me?fields=id,user_id,username,name,profile_picture_url&access_token=${encodeURIComponent(accessToken)}`;

      const response = await fetch(endpoint);
      const data = await parseResponse(response);

      const username = typeof data.username === "string" ? data.username : undefined;
      const accountName = typeof data.name === "string" ? data.name : username || "Instagram Professional Account";

      return {
        ok: true,
        accountName,
        username,
      };
    } catch (error) {
      const normalized = normalizeInstagramError(error);
      return {
        ok: false,
        error: `${normalized.code}: ${normalized.message}`,
      };
    }
  }

  /**
   * Polls Instagram media container status until FINISHED.
   */
  private async waitForContainer(containerId: string, accessToken: string, maxAttempts = 10, pollIntervalMs = 5000): Promise<void> {
    const version = getApiVersion();

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const url = `${graphBase}/${version}/${encodeURIComponent(containerId)}?fields=status_code,status&access_token=${encodeURIComponent(accessToken)}`;
      const response = await fetch(url);
      const data = await parseResponse(response);
      const statusCode = data.status_code;

      if (statusCode === "FINISHED" || statusCode === "PUBLISHED") {
        return;
      }

      if (statusCode === "ERROR" || statusCode === "EXPIRED") {
        throw normalizeInstagramError(new Error(`Instagram media container processing failed with status: ${String(statusCode)}.`));
      }

      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }
    }

    throw normalizeInstagramError(new Error("Instagram media container did not finish processing in time."));
  }
}
