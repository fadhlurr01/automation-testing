import type { PlatformErrorCode, PlatformFailure } from "@/lib/publishing/types";

export interface MediumApiErrorResponse {
  errors?: Array<{
    message?: string;
    code?: number;
  }>;
  error?: string;
  message?: string;
}

export function normalizeMediumError(input: unknown): PlatformFailure {
  let message = "Unknown Medium platform error";
  let code: PlatformErrorCode = "UNKNOWN_ERROR";
  let retryable = false;

  if (typeof input === "object" && input !== null) {
    const obj = input as MediumApiErrorResponse;
    if (Array.isArray(obj.errors) && obj.errors.length > 0) {
      message = obj.errors[0].message || message;
      const errCode = obj.errors[0].code;
      if (errCode === 6000 || errCode === 6001 || errCode === 6003) {
        code = "PLATFORM_AUTH_ERROR";
      } else if (errCode === 6004 || errCode === 6005 || errCode === 6012) {
        code = "PERMISSION_DENIED";
      } else if (errCode && errCode >= 6013 && errCode <= 6027) {
        code = "INVALID_CONTENT";
      }
    } else if (typeof obj.message === "string") {
      message = obj.message;
    } else if (typeof obj.error === "string") {
      message = obj.error;
    }
  } else if (typeof input === "string") {
    message = input;
  }

  const lower = message.toLowerCase();
  if (code === "UNKNOWN_ERROR") {
    if (lower.includes("token") || lower.includes("unauthorized") || lower.includes("401") || lower.includes("auth")) {
      code = "PLATFORM_AUTH_ERROR";
    } else if (lower.includes("forbidden") || lower.includes("permission") || lower.includes("403")) {
      code = "PERMISSION_DENIED";
    } else if (lower.includes("rate limit") || lower.includes("429") || lower.includes("too many requests")) {
      code = "PLATFORM_RATE_LIMIT";
      retryable = true;
    } else if (lower.includes("content") || lower.includes("title") || lower.includes("format") || lower.includes("tag")) {
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
