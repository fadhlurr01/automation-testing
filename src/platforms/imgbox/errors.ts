import type { PlatformErrorCode, PlatformFailure } from "@/lib/publishing/types";

export function normalizeImgboxError(input: unknown): PlatformFailure {
  let message = "Unknown Imgbox platform error";
  let code: PlatformErrorCode = "UNKNOWN_ERROR";
  let retryable = false;

  if (input instanceof Error) {
    message = input.message;
  } else if (typeof input === "string") {
    message = input;
  } else if (typeof input === "object" && input !== null) {
    const obj = input as { message?: string; error?: string };
    message = obj.message || obj.error || message;
  }

  const lower = message.toLowerCase();
  if (lower.includes("unauthorized") || lower.includes("api key") || lower.includes("auth")) {
    code = "PLATFORM_AUTH_ERROR";
  } else if (lower.includes("size") || lower.includes("large") || lower.includes("format") || lower.includes("mime") || lower.includes("image")) {
    code = "INVALID_MEDIA";
  } else if (lower.includes("rate") || lower.includes("limit") || lower.includes("429")) {
    code = "PLATFORM_RATE_LIMIT";
    retryable = true;
  } else if (lower.includes("timeout") || lower.includes("offline") || lower.includes("500") || lower.includes("503") || lower.includes("service")) {
    code = "PLATFORM_UNAVAILABLE";
    retryable = true;
  }

  const error = new Error(message) as PlatformFailure;
  error.code = code;
  error.retryable = retryable;
  return error;
}
