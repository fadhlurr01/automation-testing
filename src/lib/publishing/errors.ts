import type { PlatformErrorCode } from "@/lib/publishing/types";

export function normalizePlatformError(error: unknown): PlatformErrorCode {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("auth") || message.includes("token") || message.includes("401")) return "PLATFORM_AUTH_ERROR";
  if (message.includes("rate") || message.includes("429")) return "PLATFORM_RATE_LIMIT";
  if (message.includes("media") || message.includes("file")) return "INVALID_MEDIA";
  if (message.includes("content") || message.includes("body")) return "INVALID_CONTENT";
  if (message.includes("permission") || message.includes("403")) return "PERMISSION_DENIED";
  if (message.includes("timeout") || message.includes("unavailable") || message.includes("503")) return "PLATFORM_UNAVAILABLE";
  return "UNKNOWN_ERROR";
}
