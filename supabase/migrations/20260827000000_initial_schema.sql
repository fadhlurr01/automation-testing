create extension if not exists pgcrypto;

create table public.organizations (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade, organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text, role text not null default 'member', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.platforms (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, category text not null default 'social',
  api_enabled boolean not null default false, oauth_enabled boolean not null default false, publish_enabled boolean not null default false, upload_enabled boolean not null default false,
  supports_image boolean not null default false, supports_video boolean not null default false, supports_article boolean not null default false, supports_link boolean not null default false,
  supports_hashtag boolean not null default false, supports_tags boolean not null default false, supports_analytics boolean not null default false,
  status text not null default 'planned', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.connected_accounts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, platform_id uuid not null references public.platforms(id),
  account_id text not null, account_name text not null, username text, avatar_url text, status text not null default 'pending', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(platform_id, account_id)
);
create table public.oauth_tokens (
  id uuid primary key default gen_random_uuid(), connected_account_id uuid not null unique references public.connected_accounts(id) on delete cascade,
  access_token_encrypted text not null, refresh_token_encrypted text, expires_at timestamptz, scope text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.media_assets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade, storage_path text not null unique, file_name text not null,
  mime_type text not null, size_bytes bigint not null, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.content_items (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, media_asset_id uuid references public.media_assets(id) on delete set null,
  title text, description text, caption text, keywords text[] not null default '{}', hashtags text[] not null default '{}', cta text, destination_url text, alt_text text,
  ai_generated boolean not null default false, status text not null default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.content_variants (
  id uuid primary key default gen_random_uuid(), content_item_id uuid not null references public.content_items(id) on delete cascade, platform_id uuid not null references public.platforms(id),
  title text, subtitle text, body text, caption text, hashtags text[] not null default '{}', tags text[] not null default '{}', alt_text text, metadata jsonb not null default '{}'::jsonb,
  status text not null default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(content_item_id, platform_id)
);
create table public.campaigns (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, created_by uuid not null references public.users(id) on delete restrict, name text not null, description text,
  status text not null default 'draft', scheduled_at timestamptz, timezone text not null default 'UTC', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.campaign_targets (
  id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.campaigns(id) on delete cascade, connected_account_id uuid not null references public.connected_accounts(id) on delete cascade,
  content_variant_id uuid not null references public.content_variants(id), status text not null default 'pending', scheduled_at timestamptz, published_at timestamptz, external_post_id text, external_url text, error_code text, error_message text
);
create table public.publishing_jobs (
  id uuid primary key default gen_random_uuid(), campaign_target_id uuid not null references public.campaign_targets(id) on delete cascade, job_type text not null default 'publish', priority int not null default 0,
  status text not null default 'queued', attempts int not null default 0, max_attempts int not null default 3, scheduled_at timestamptz not null default now(), started_at timestamptz, completed_at timestamptz, error_message text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.publishing_logs (
  id uuid primary key default gen_random_uuid(), publishing_job_id uuid not null references public.publishing_jobs(id) on delete cascade, event text not null, status_code int, request_metadata jsonb, response_metadata jsonb, created_at timestamptz not null default now()
);
create table public.brand_profiles (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null unique references public.organizations(id) on delete cascade, brand_name text not null, language text not null default 'en', tone text, description text, default_cta text, forbidden_words text[] not null default '{}', brand_rules jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete set null, organization_id uuid not null references public.organizations(id) on delete cascade, action text not null, entity_type text not null, entity_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create or replace function public.current_organization_id() returns uuid language sql stable security definer set search_path = public as $$ select organization_id from public.users where id = auth.uid() $$;
create or replace function public.is_org_member(target_org uuid) returns boolean language sql stable security definer set search_path = public as $$ select target_org = public.current_organization_id() $$;

alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.connected_accounts enable row level security;
alter table public.oauth_tokens enable row level security;
alter table public.media_assets enable row level security;
alter table public.content_items enable row level security;
alter table public.content_variants enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_targets enable row level security;
alter table public.publishing_jobs enable row level security;
alter table public.publishing_logs enable row level security;
alter table public.brand_profiles enable row level security;
alter table public.audit_logs enable row level security;

create policy "members can read own organization" on public.organizations for select using (id = public.current_organization_id());
create policy "members can read organization users" on public.users for select using (organization_id = public.current_organization_id());
create policy "organization members" on public.connected_accounts for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "user media access" on public.media_assets for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "organization content access" on public.content_items for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "organization variants access" on public.content_variants for all using (exists (select 1 from public.content_items c where c.id = content_item_id and public.is_org_member(c.organization_id))) with check (exists (select 1 from public.content_items c where c.id = content_item_id and public.is_org_member(c.organization_id)));
create policy "organization campaigns access" on public.campaigns for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "organization targets access" on public.campaign_targets for all using (exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_org_member(c.organization_id))) with check (exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_org_member(c.organization_id)));
create policy "organization jobs access" on public.publishing_jobs for all using (exists (select 1 from public.campaign_targets t join public.campaigns c on c.id = t.campaign_id where t.id = campaign_target_id and public.is_org_member(c.organization_id))) with check (exists (select 1 from public.campaign_targets t join public.campaigns c on c.id = t.campaign_id where t.id = campaign_target_id and public.is_org_member(c.organization_id)));
create policy "organization logs access" on public.publishing_logs for all using (exists (select 1 from public.publishing_jobs j join public.campaign_targets t on t.id = j.campaign_target_id join public.campaigns c on c.id = t.campaign_id where j.id = publishing_job_id and public.is_org_member(c.organization_id))) with check (exists (select 1 from public.publishing_jobs j join public.campaign_targets t on t.id = j.campaign_target_id join public.campaigns c on c.id = t.campaign_id where j.id = publishing_job_id and public.is_org_member(c.organization_id)));
create policy "organization brand access" on public.brand_profiles for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "organization audit access" on public.audit_logs for select using (public.is_org_member(organization_id));

insert into public.platforms (name, slug, category, status) values
  ('Instagram', 'instagram', 'social', 'planned'), ('Facebook', 'facebook', 'social', 'planned'), ('LinkedIn', 'linkedin', 'professional', 'planned'), ('YouTube', 'youtube', 'video', 'planned'), ('TikTok', 'tiktok', 'video', 'planned')
on conflict (slug) do nothing;

create index campaigns_organization_id_idx on public.campaigns(organization_id);
create index content_items_organization_id_idx on public.content_items(organization_id);
create index campaign_targets_campaign_id_idx on public.campaign_targets(campaign_id);
create index publishing_jobs_queue_idx on public.publishing_jobs(status, scheduled_at, priority desc);
create index audit_logs_organization_created_at_idx on public.audit_logs(organization_id, created_at desc);
