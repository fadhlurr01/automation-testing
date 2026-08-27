import type { PublishingQueue, RedisLikeClient } from "@/lib/publishing/types";

const QUEUE_KEY = "automation-hub:publishing";

export class RedisPublishingQueue implements PublishingQueue {
  constructor(private readonly redis: RedisLikeClient) {}
  async enqueue(jobId: string, scheduledAt: string) { await this.redis.lPush(QUEUE_KEY, JSON.stringify({ jobId, scheduledAt })); }
  async dequeue(timeoutSeconds = 5) { const item = await this.redis.brPop(QUEUE_KEY, timeoutSeconds); if (!item) return null; return (JSON.parse(item.element) as { jobId: string }).jobId; }
}

export function retryDelaySeconds(attempt: number) { return 30 * (2 ** Math.max(0, attempt - 1)); }
