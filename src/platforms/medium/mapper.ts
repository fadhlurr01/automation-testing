import type { PublishRequest } from "@/lib/publishing/types";
import { normalizeMediumError } from "./errors";
import { mediumCapabilities } from "./capabilities";

export interface MediumMappedArticle {
  authorId?: string;
  title: string;
  contentFormat: "markdown" | "html";
  content: string;
  tags?: string[];
  canonicalUrl?: string;
  publishStatus: "public" | "draft" | "unlisted";
}

export function mapMediumArticle(request: PublishRequest): MediumMappedArticle {
  const rawTitle =
    typeof request.content.title === "string" && request.content.title.trim() !== ""
      ? request.content.title.trim()
      : typeof request.content.headline === "string"
      ? request.content.headline.trim()
      : "";

  if (!rawTitle) {
    throw normalizeMediumError(new Error("Medium story requires a title."));
  }

  const title = rawTitle.slice(0, mediumCapabilities.max_title_length);

  let content =
    typeof request.content.body === "string" && request.content.body.trim() !== ""
      ? request.content.body.trim()
      : typeof request.content.content === "string" && request.content.content.trim() !== ""
      ? request.content.content.trim()
      : typeof request.content.caption === "string"
      ? request.content.caption.trim()
      : "";

  if (!content) {
    throw normalizeMediumError(new Error("Medium story requires non-empty body content."));
  }

  // Format content to Markdown if image is attached
  if (request.media?.url && !content.includes(request.media.url)) {
    content = `![Cover Image](${request.media.url})\n\n${content}`;
  }

  const formatCandidate =
    typeof request.content.contentFormat === "string"
      ? request.content.contentFormat.toLowerCase()
      : "markdown";
  const contentFormat: "markdown" | "html" = formatCandidate === "html" ? "html" : "markdown";

  let tags: string[] | undefined;
  if (Array.isArray(request.content.tags)) {
    tags = request.content.tags
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .slice(0, mediumCapabilities.max_tags);
  } else if (typeof request.content.tags === "string") {
    tags = request.content.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, mediumCapabilities.max_tags);
  }

  const statusCandidate =
    typeof request.content.publishStatus === "string"
      ? request.content.publishStatus.toLowerCase()
      : "public";

  const publishStatus: "public" | "draft" | "unlisted" =
    statusCandidate === "draft" || statusCandidate === "unlisted" ? statusCandidate : "public";

  const canonicalUrl =
    typeof request.content.canonicalUrl === "string" ? request.content.canonicalUrl.trim() : undefined;

  return {
    authorId: request.accountId,
    title,
    contentFormat,
    content,
    tags,
    canonicalUrl,
    publishStatus,
  };
}
