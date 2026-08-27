alter table public.publishing_jobs drop constraint if exists publishing_jobs_status_check;
alter table public.publishing_jobs add constraint publishing_jobs_status_check check (status in ('QUEUED', 'PROCESSING', 'PUBLISHED', 'FAILED', 'RETRYING', 'CANCELLED'));
alter table public.publishing_jobs alter column status set default 'QUEUED';
alter table public.publishing_jobs add constraint publishing_jobs_attempts_check check (attempts >= 0 and max_attempts > 0 and attempts <= max_attempts);
alter table public.campaign_targets drop constraint if exists campaign_targets_error_code_check;
alter table public.campaign_targets add constraint campaign_targets_error_code_check check (error_code is null or error_code in ('PLATFORM_AUTH_ERROR', 'PLATFORM_RATE_LIMIT', 'INVALID_MEDIA', 'INVALID_CONTENT', 'PERMISSION_DENIED', 'PLATFORM_UNAVAILABLE', 'UNKNOWN_ERROR'));
