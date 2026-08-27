import type { PlatformAdapter } from "@/lib/publishing/types";
import { retryDelaySeconds } from "@/lib/publishing/queue";
import { normalizePlatformError } from "@/lib/publishing/errors";

export type WorkerStore = {
  claim(jobId: string): Promise<{ id: string; attempts: number; max_attempts: number; campaign_target_id: string } | null>;
  loadTarget(targetId: string): Promise<{ platformSlug: string; accessToken: string; accountId?: string; content: Record<string, unknown>; media?: { storagePath: string; mimeType: string; url?: string } }>;
  markProcessing(jobId: string): Promise<void>;
  markPublished(jobId: string, externalPostId?: string, externalUrl?: string): Promise<void>;
  markRetrying(jobId: string, error: string, scheduledAt: string): Promise<void>;
  markFailed(jobId: string, error: string): Promise<void>;
  log(jobId: string, event: string, statusCode?: number): Promise<void>;
};

export async function processPublishingJob(jobId: string, store: WorkerStore, adapters: Record<string, PlatformAdapter>) {
  const job = await store.claim(jobId); if (!job) return;
  await store.markProcessing(jobId); const target = await store.loadTarget(job.campaign_target_id); const adapter = adapters[target.platformSlug];
  if (!adapter) { await store.markFailed(jobId, "No production platform adapter is configured."); await store.log(jobId, "adapter_unavailable"); return; }
  try { const result = await adapter.publish({ accessToken: target.accessToken, accountId: target.accountId, content: target.content, media: target.media }); const verified = result.confirmed && await adapter.verify(result, target.accessToken); if (!verified) throw new Error("Platform response could not be verified."); await store.markPublished(jobId, result.externalPostId, result.externalUrl); await store.log(jobId, "published", result.statusCode); }
  catch (error) { const message = error instanceof Error ? error.message : "Unknown publishing error"; const code = normalizePlatformError(error); if (job.attempts < job.max_attempts) { const scheduledAt = new Date(Date.now() + retryDelaySeconds(job.attempts) * 1000).toISOString(); await store.markRetrying(jobId, `${code}: ${message}`, scheduledAt); await store.log(jobId, "retrying"); } else { await store.markFailed(jobId, `${code}: ${message}`); await store.log(jobId, "failed"); } }
}
