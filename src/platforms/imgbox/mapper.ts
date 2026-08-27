import type { PublishRequest } from "@/lib/publishing/types";
import { normalizeImgboxError } from "./errors";
import { imgboxCapabilities } from "./capabilities";

export interface ImgboxMappedUpload {
  imageUrl?: string;
  storagePath?: string;
  mimeType: string;
  galleryTitle?: string;
  commentsEnabled?: boolean;
}

export function mapImgboxUpload(request: PublishRequest): ImgboxMappedUpload {
  if (!request.media?.url && !request.media?.storagePath) {
    throw normalizeImgboxError(new Error("Imgbox upload requires a media URL or storage path."));
  }

  const mime = request.media.mimeType || "image/jpeg";
  if (!imgboxCapabilities.supported_image_types.includes(mime as "image/jpeg" | "image/png" | "image/gif")) {
    throw normalizeImgboxError(new Error(`Unsupported image type '${mime}'. Imgbox supports JPEG, PNG, and GIF.`));
  }

  const galleryTitle =
    typeof request.content.title === "string"
      ? request.content.title.trim()
      : typeof request.content.caption === "string"
      ? request.content.caption.trim()
      : undefined;

  return {
    imageUrl: request.media.url,
    storagePath: request.media.storagePath,
    mimeType: mime,
    galleryTitle,
    commentsEnabled: Boolean(request.content.comments_enabled),
  };
}
