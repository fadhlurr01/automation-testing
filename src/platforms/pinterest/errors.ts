import type { PlatformErrorCode, PlatformFailure } from "@/lib/publishing/types";

export interface PinterestApiErrorResponse {
  code?: number;
  message?: string;
  details?: Record<string, unknown>;
  error?: {
    code?: number;
    message?: string;
  };
}

export function normalizePinterestError(input: unknown): PlatformFailure {
  let message = "Unknown Pinterest platform error";
  let code: PlatformErrorCode = "UNKNOWN_ERROR";
  let retryable = false;

  if (typeof input === "object" && input !== null) {
    const obj = input as PinterestApiErrorResponse;
    message = obj.message || obj.error?.message || message;
    const errCode = obj.code || obj.error?.code;

    if (errCode === 401 || errCode === 403 || errCode === 1 || errCode === 2) {
      code = errCode === 403 ? "PERMISSION_DENIED" : "PLATFORM_AUTH_ERROR";
    } else if (errCode === 429) {
      code = "PLATFORM_RATE_LIMIT";
      retryable = true;
    } else if (errCode === 400 || errCode === 422) {
      const lower = message.toLowerCase();
      if (lower.includes("image") || lower.includes("media") || lower.includes("url")) {
        code = "INVALID_MEDIA";
      } else if (lower.includes("title") || lower.includes("description") || lower.includes("board")) {
        code = "INVALID_CONTENT";
      }
    } else if (errCode && errCode >= 500) {
      code = "PLATFORM_UNAVAILABLE";
      retryable = true;
    }
  } else if (typeof input === "string") {
    message = input;
  }

  const lower = message.toLowerCase();
  if (code === "UNKNOWN_ERROR") {
    if (lower.includes("oauth") || lower.includes("unauthorized") || lower.includes("token") || lower.includes("401")) {
      code = "PLATFORM_AUTH_ERROR";
    } else if (lower.includes("permission") || lower.includes("forbidden") || lower.includes("403")) {
      code = "PERMISSION_DENIED";
    } else if (lower.includes("rate limit") || lower.includes("429") || lower.includes("too many requests")) {
      code = "PLATFORM_RATE_LIMIT";
      retryable = true;
    } else if (lower.includes("media") || lower.includes("image") || lower.includes("aspect ratio") || lower.includes("format")) {
      code = "INVALID_MEDIA";
    } else if (lower.includes("board") || lower.includes("title") || lower.includes("description") || lower.includes("link")) {
      code = "INVALID_CONTENT";
    } else if (lower.includes("timeout") || lower.includes("500") || lower.includes("503") || lower.includes("temporar")) {
      code = "PLATFORM_UNAVAILABLE";
      retryable = true;
    }
  }

  const error = new Error(message) as PlatformFailure;
  error.code = code;
  error.retryable = retryable;
  return error;
}
