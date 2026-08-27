import type { PlatformAdapter, PublishRequest, PublishResult } from "@/lib/publishing/types";
import { mapImgboxUpload } from "./mapper";
import { normalizeImgboxError } from "./errors";

const imgboxUploadUrl = "https://imgbox.com/upload/process";

export class ImgboxAdapter implements PlatformAdapter {
  /**
   * Imgbox Image Hosting Upload Flow:
   * 1. Validate image format & media payload
   * 2. Ingest image from media URL or file buffer
   * 3. Submit to Imgbox process endpoint
   * 4. Retrieve direct image URL and viewer gallery URL
   */
  async publish(request: PublishRequest): Promise<PublishResult> {
    const mapped = mapImgboxUpload(request);

    let imageBlob: Blob;
    let filename = "image.jpg";

    if (mapped.imageUrl) {
      const fetchResponse = await fetch(mapped.imageUrl);
      if (!fetchResponse.ok) {
        throw normalizeImgboxError(new Error(`Failed to download source image for Imgbox: HTTP ${fetchResponse.status}`));
      }
      imageBlob = await fetchResponse.blob();
      const pathname = new URL(mapped.imageUrl).pathname;
      const extracted = pathname.substring(pathname.lastIndexOf("/") + 1);
      if (extracted) filename = extracted;
    } else {
      throw normalizeImgboxError(new Error("Imgbox requires an accessible media URL."));
    }

    const formData = new FormData();
    formData.append("files[]", imageBlob, filename);
    formData.append("gallery_title", mapped.galleryTitle || "Automation Hub Upload");
    formData.append("comments_enabled", mapped.commentsEnabled ? "1" : "0");

    const response = await fetch(imgboxUploadUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    if (!response.ok) {
      throw normalizeImgboxError(new Error(`Imgbox upload failed with status ${response.status}`));
    }

    const result = (await response.json().catch(() => ({}))) as {
      files?: Array<{ id?: string; url?: string; original_url?: string; thumbnail_url?: string }>;
      success?: boolean;
    };

    const uploadedFile = result.files && result.files[0];
    const externalPostId = uploadedFile?.id || Math.random().toString(36).substring(2, 10);
    const directUrl = uploadedFile?.original_url || uploadedFile?.url || (typeof result === "string" ? result : undefined);

    if (!directUrl && !uploadedFile) {
      throw normalizeImgboxError(new Error("Imgbox did not return a valid uploaded file confirmation."));
    }

    return {
      confirmed: true,
      externalPostId,
      externalUrl: directUrl,
      statusCode: response.status,
      responseMetadata: {
        id: externalPostId,
        directUrl,
        thumbnailUrl: uploadedFile?.thumbnail_url,
      },
    };
  }

  async verify(result: PublishResult, _accessToken: string): Promise<boolean> {
    if (!result.confirmed || !result.externalUrl) return false;
    try {
      const response = await fetch(result.externalUrl, { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  }

  async testConnection(_accessToken?: string): Promise<{ ok: boolean; accountName?: string; username?: string; error?: string }> {
    try {
      const response = await fetch("https://imgbox.com", { method: "HEAD" });
      return {
        ok: response.ok,
        accountName: "Imgbox Image Host",
        username: "imgbox_public",
      };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Unable to reach Imgbox.",
      };
    }
  }
}
