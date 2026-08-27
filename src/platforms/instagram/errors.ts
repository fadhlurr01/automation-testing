import type { PlatformErrorCode, PlatformFailure } from "@/lib/publishing/types";

export interface MetaGraphApiErrorResponse {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    is_transient?: boolean;
    error_user_title?: string;
    error_user_msg?: string;
    fbtrace_id?: string;
  };
  error_message?: string;
}

export function normalizeInstagramError(input: unknown): PlatformFailure {
  let message = "Unknown Instagram platform error";
  let code: PlatformErrorCode = "UNKNOWN_ERROR";
  let retryable = false;

  if (typeof input === "object" && input !== null) {
    const obj = input as MetaGraphApiErrorResponse & { code?: string | number; message?: string };
    const err = obj.error;

    if (err) {
      message = err.error_user_msg || err.message || message;
      const errorCode = err.code;
      const subcode = err.error_subcode;

      // Meta OAuth & Permission Errors
      if (errorCode === 190 || subcode === 458 || subcode === 460 || subcode === 463 || subcode === 467) {
        code = "PLATFORM_AUTH_ERROR";
      } else if (errorCode === 10 || errorCode === 200 || (errorCode && errorCode >= 200 && errorCode <= 299)) {
        code = "PERMISSION_DENIED";
      }
      // Rate limits
      else if (errorCode === 4 || errorCode === 17 || errorCode === 32 || errorCode === 613) {
        code = "PLATFORM_RATE_LIMIT";
        retryable = true;
      }
      // Media errors (Aspect ratio, invalid image/video url, format not supported)
      else if (
        errorCode === 24 ||
        errorCode === 100 ||
        errorCode === 352 ||
        (errorCode && errorCode >= 2207001 && errorCode <= 2207050)
      ) {
        code = "INVALID_MEDIA";
      }
      // Transient / Temporary Meta server errors
      else if (errorCode === 1 || errorCode === 2 || err.is_transient) {
        code = "PLATFORM_UNAVAILABLE";
        retryable = true;
      }
    } else if (typeof obj.message === "string") {
      message = obj.message;
    } else if (typeof obj.error_message === "string") {
      message = obj.error_message;
    }
  } else if (typeof input === "string") {
    message = input;
  }

  const lower = message.toLowerCase();
  if (code === "UNKNOWN_ERROR") {
    if (lower.includes("oauth") || lower.includes("access token") || lower.includes("token expired") || lower.includes("190")) {
      code = "PLATFORM_AUTH_ERROR";
    } else if (lower.includes("permission") || lower.includes("scope") || lower.includes("unauthorized") || lower.includes("forbidden")) {
      code = "PERMISSION_DENIED";
    } else if (lower.includes("rate limit") || lower.includes("too many requests") || lower.includes("429")) {
      code = "PLATFORM_RATE_LIMIT";
      retryable = true;
    } else if (lower.includes("media") || lower.includes("aspect ratio") || lower.includes("image") || lower.includes("video") || lower.includes("resolution") || lower.includes("download failed")) {
      code = "INVALID_MEDIA";
    } else if (lower.includes("caption") || lower.includes("content") || lower.includes("character limit")) {
      code = "INVALID_CONTENT";
    } else if (lower.includes("timeout") || lower.includes("service unavailable") || lower.includes("503") || lower.includes("500") || lower.includes("temporary")) {
      code = "PLATFORM_UNAVAILABLE";
      retryable = true;
    }
  }

  const error = new Error(message) as PlatformFailure;
  error.code = code;
  error.retryable = retryable;
  return error;
}
