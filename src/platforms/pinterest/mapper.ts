import type { PublishRequest } from "@/lib/publishing/types";
import { normalizePinterestError } from "./errors";
import { pinterestCapabilities } from "./capabilities";

export interface PinterestMappedPin {
  boardId: string;
  title?: string;
  description?: string;
  link?: string;
  altText?: string;
  mediaUrl: string;
  mediaType: "image" | "video";
}

export function mapPinterestPin(request: PublishRequest): PinterestMappedPin {
  if (!request.media?.url) {
    throw normalizePinterestError(new Error("Pinterest Pin creation requires a valid media URL."));
  }

  const boardId =
    typeof request.content.board_id === "string" && request.content.board_id.trim() !== ""
      ? request.content.board_id.trim()
      : request.accountId || "";

  if (!boardId) {
    throw normalizePinterestError(new Error("Pinterest requires a destination board_id."));
  }

  let title = typeof request.content.title === "string" ? request.content.title.trim() : undefined;
  if (title && title.length > pinterestCapabilities.max_title_length) {
    title = title.slice(0, pinterestCapabilities.max_title_length);
  }

  let description =
    typeof request.content.description === "string"
      ? request.content.description.trim()
      : typeof request.content.body === "string"
      ? request.content.body.trim()
      : typeof request.content.caption === "string"
      ? request.content.caption.trim()
      : undefined;

  if (description && description.length > pinterestCapabilities.max_description_length) {
    description = description.slice(0, pinterestCapabilities.max_description_length);
  }

  const link = typeof request.content.link === "string" ? request.content.link.trim() : undefined;
  const altText = typeof request.content.alt_text === "string" ? request.content.alt_text.trim() : undefined;

  const mime = request.media.mimeType || "";
  const isVideo = mime.startsWith("video/") || request.media.url.endsWith(".mp4");

  return {
    boardId,
    title,
    description,
    link,
    altText,
    mediaUrl: request.media.url,
    mediaType: isVideo ? "video" : "image",
  };
}
