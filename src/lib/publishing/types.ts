export type PublishingJobStatus = "QUEUED" | "PROCESSING" | "PUBLISHED" | "FAILED" | "RETRYING" | "CANCELLED";
export type PlatformErrorCode = "PLATFORM_AUTH_ERROR" | "PLATFORM_RATE_LIMIT" | "INVALID_MEDIA" | "INVALID_CONTENT" | "PERMISSION_DENIED" | "PLATFORM_UNAVAILABLE" | "UNKNOWN_ERROR";

export type PublishRequest = { accessToken: string; content: Record<string, unknown>; media?: { storagePath: string; mimeType: string } };
export type PublishResult = { confirmed: true; externalPostId?: string; externalUrl?: string; statusCode?: number; responseMetadata?: Record<string, unknown> };
export type PlatformFailure = Error & { code: PlatformErrorCode; retryable: boolean };

export interface PlatformAdapter { publish(request: PublishRequest): Promise<PublishResult>; verify(result: PublishResult): Promise<boolean>; }
export interface RedisLikeClient { lPush(key: string, value: string): Promise<number>; brPop(key: string, timeoutSeconds: number): Promise<{ key: string; element: string } | null>; }
export interface PublishingQueue { enqueue(jobId: string, scheduledAt: string): Promise<void>; dequeue(timeoutSeconds?: number): Promise<string | null>; }
