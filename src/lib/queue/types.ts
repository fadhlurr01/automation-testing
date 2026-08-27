export type PublishingJobStatus = "queued" | "processing" | "succeeded" | "failed";

export type PublishingJob = {
  id: string;
  campaignTargetId: string;
  scheduledAt: string;
  attempts: number;
  maxAttempts: number;
  status: PublishingJobStatus;
};

export interface PublishingQueue {
  enqueue(job: PublishingJob): Promise<void>;
  retry(jobId: string): Promise<void>;
}
