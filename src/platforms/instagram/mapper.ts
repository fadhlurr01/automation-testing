import type { PublishRequest } from "@/lib/publishing/types";
import { normalizeInstagramError } from "./errors";
import { instagramCapabilities } from "./capabilities";

export interface InstagramMappedMedia {
  accountId: string;
  mediaType: "IMAGE" | "REELS" | "VIDEO";
  mediaUrl: string;
  caption?: string;
  altText?: string;
  shareToFeed?: boolean;
}

export function mapInstagramMedia(request: PublishRequest): InstagramMappedMedia {
  if (!request.accountId || request.accountId.trim() === "") {
    throw normalizeInstagramError(new Error("Instagram Professional account ID is required for publishing."));
  }

  if (!request.media?.url) {
    throw normalizeInstagramError(new Error("Instagram API requires a publicly accessible HTTPS media URL."));
  }

  const url = request.media.url.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    throw normalizeInstagramError(new Error("Instagram media URL must be a valid HTTP/HTTPS URL."));
  }

  const mime = request.media.mimeType || "";
  const isVideo = mime.startsWith("video/") || url.endsWith(".mp4") || url.endsWith(".mov");
  const mediaType: "IMAGE" | "REELS" | "VIDEO" = isVideo ? "REELS" : "IMAGE";

  let caption = typeof request.content.caption === "string" ? request.content.caption : undefined;
  if (typeof request.content.body === "string" && !caption) {
    caption = request.content.body;
  }

  if (caption && caption.length > instagramCapabilities.max_caption_length) {
    throw normalizeInstagramError(
      new Error(`Caption exceeds Instagram maximum length of ${instagramCapabilities.max_caption_length} characters.`)
    );
  }

  const altText = typeof request.content.alt_text === "string" ? request.content.alt_text : undefined;
  const shareToFeed = typeof request.content.share_to_feed === "boolean" ? request.content.share_to_feed : true;

  return {
    accountId: request.accountId,
    mediaType,
    mediaUrl: url,
    caption,
    altText,
    shareToFeed,
  };
}
