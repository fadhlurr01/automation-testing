-- ==============================================================================
-- AUTOMATION HUB — MASTER POSTGRESQL SCHEMA (SUPABASE DDL)
-- ==============================================================================
-- Engine: PostgreSQL 15+ (Supabase)
-- Extensions: pgcrypto, uuid-ossp
-- ==============================================================================

-- 1. Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. Organizations & Multi-Tenant Workspaces
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. Workspace Users (Linked to auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. Platforms Registry (Social, Blogging, Image Hosting, Portfolio, Stock)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'social',
    api_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    oauth_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    publish_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    upload_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    supports_image BOOLEAN NOT NULL DEFAULT TRUE,
    supports_video BOOLEAN NOT NULL DEFAULT FALSE,
    supports_article BOOLEAN NOT NULL DEFAULT FALSE,
    supports_link BOOLEAN NOT NULL DEFAULT TRUE,
    supports_hashtag BOOLEAN NOT NULL DEFAULT TRUE,
    supports_tags BOOLEAN NOT NULL DEFAULT TRUE,
    supports_analytics BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'active',
    portal_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. Connected Platform Accounts
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.connected_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES public.platforms(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    username TEXT,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'expired', 'error')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (platform_id, account_id)
);

-- ------------------------------------------------------------------------------
-- 6. Encrypted OAuth & Integration Tokens (Server-Only AES-256-GCM)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.oauth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connected_account_id UUID NOT NULL UNIQUE REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    expires_at TIMESTAMPTZ,
    scope TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. Media Assets (Posters, Creative Graphics, Video)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    width INT,
    height INT,
    duration INT,
    thumbnail_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. Content Items & AI Drafts
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    media_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
    title TEXT,
    description TEXT,
    caption TEXT,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    hashtags TEXT[] NOT NULL DEFAULT '{}',
    cta TEXT,
    destination_url TEXT,
    alt_text TEXT,
    facts JSONB NOT NULL DEFAULT '{}'::jsonb,
    seo_title TEXT,
    seo_description TEXT,
    ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'approved', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. Content Variants (Platform-Tailored Payloads)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES public.platforms(id) ON DELETE CASCADE,
    variant_type TEXT NOT NULL DEFAULT 'post',
    title TEXT,
    subtitle TEXT,
    body TEXT,
    caption TEXT,
    hashtags TEXT[] NOT NULL DEFAULT '{}',
    tags TEXT[] NOT NULL DEFAULT '{}',
    alt_text TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('draft', 'ready', 'published')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (content_item_id, platform_id)
);

-- ------------------------------------------------------------------------------
-- 10. Campaigns & Multi-Channel Distribution Plans
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'approved', 'in_progress', 'published', 'failed')),
    scheduled_at TIMESTAMPTZ,
    timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. Campaign Targets (Per Platform Target Mapping)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaign_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    connected_account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
    content_variant_id UUID NOT NULL REFERENCES public.content_variants(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'publishing', 'published', 'failed', 'manual_assist')),
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    external_post_id TEXT,
    external_url TEXT,
    error_code TEXT,
    error_message TEXT
);

-- ------------------------------------------------------------------------------
-- 12. Publishing Jobs (Background Queue Table)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.publishing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_target_id UUID NOT NULL REFERENCES public.campaign_targets(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL DEFAULT 'publish',
    priority INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'RETRYING', 'CANCELLED')),
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 13. Publishing Logs (Detailed Adapter Execution History)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.publishing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publishing_job_id UUID NOT NULL REFERENCES public.publishing_jobs(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    status_code INT,
    request_metadata JSONB,
    response_metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 14. Brand Profiles & Guidelines
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brand_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'id',
    tone TEXT DEFAULT 'professional',
    description TEXT,
    default_cta TEXT,
    forbidden_words TEXT[] NOT NULL DEFAULT '{}',
    brand_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 15. Audit Logs (Immutable Zero-Credential Security Trail)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL DEFAULT 'User',
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    description TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILURE', 'WARNING', 'INFO')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 16. Performance Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_org ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_conn_acc_org ON public.connected_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_org ON public.campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaign_targets_camp ON public.campaign_targets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_publishing_jobs_status_sched ON public.publishing_jobs(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON public.audit_logs(organization_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 17. Seed Initial 37 Verified Active Platforms
-- ------------------------------------------------------------------------------
INSERT INTO public.platforms (name, slug, category, api_enabled, oauth_enabled, publish_enabled, supports_image, supports_video, supports_article, portal_url)
VALUES
  -- Social Media
  ('Pinterest', 'pinterest', 'social', true, true, true, true, true, false, 'https://www.pinterest.com/'),
  ('Instagram', 'instagram', 'social', true, true, true, true, true, false, 'https://www.instagram.com/'),
  ('Facebook', 'facebook', 'social', true, true, true, true, true, false, 'https://www.facebook.com/'),
  ('X / Twitter', 'twitter', 'social', false, false, false, true, true, false, 'https://x.com/'),
  ('Minds', 'minds', 'social', false, false, false, true, true, false, 'https://www.minds.com/'),
  ('Flipboard', 'flipboard', 'social', false, false, false, true, false, true, 'https://flipboard.com/'),
  ('Tripadvisor', 'tripadvisor', 'social', false, false, false, true, false, false, 'https://www.tripadvisor.co.id/'),

  -- Blog & Publishing
  ('Medium', 'medium', 'blog_publishing', true, true, true, true, false, true, 'https://medium.com/'),
  ('Wattpad', 'wattpad', 'blog_publishing', false, false, false, true, false, true, 'https://www.wattpad.com/'),
  ('Wix', 'wix', 'blog_publishing', false, false, false, true, true, true, 'https://id.wix.com/'),
  ('Penzu', 'penzu', 'blog_publishing', false, false, false, false, false, true, 'https://penzu.com/'),
  ('Weebly', 'weebly', 'blog_publishing', false, false, false, true, false, true, 'https://www.weebly.com/'),
  ('LiveJournal', 'livejournal', 'blog_publishing', false, false, false, true, false, true, 'https://livejournal.com/'),
  ('FlipHTML5', 'fliphtml5', 'blog_publishing', false, false, false, true, false, true, 'https://fliphtml5.com/'),

  -- Image & Media Hosting
  ('ImgBB', 'imgbb', 'image_hosting', true, false, true, true, false, false, 'https://imgbb.com/'),
  ('Postimages', 'postimages', 'image_hosting', false, false, false, true, false, false, 'https://postimages.org/'),
  ('Publitio', 'publitio', 'image_hosting', false, false, false, true, true, false, 'https://publit.io/'),
  ('Prnt.sc', 'prntscr', 'image_hosting', false, false, false, true, false, false, 'https://prnt.sc/'),
  ('FreeImage.host', 'freeimage-host', 'image_hosting', false, false, false, true, false, false, 'https://freeimage.host/'),
  ('ImageShack', 'imageshack', 'image_hosting', false, false, false, true, true, false, 'https://imageshack.com/'),
  ('MediaFire', 'mediafire', 'image_hosting', false, false, false, true, true, false, 'https://mediafire.com/'),
  ('4shared', '4shared', 'image_hosting', false, false, false, true, true, false, 'https://www.4shared.com/'),
  ('ImageBam', 'imagebam', 'image_hosting', false, false, false, true, false, false, 'https://www.imagebam.com/'),
  ('Shutterfly', 'shutterfly', 'image_hosting', false, false, false, true, false, false, 'https://shutterfly.com/'),
  ('TinyPic.host', 'tinypic', 'image_hosting', false, false, false, true, false, false, 'https://tinypic.host/'),
  ('Gifyu', 'gifyu', 'image_hosting', false, false, false, true, false, false, 'https://gifyu.com/'),
  ('Imgur', 'imgur', 'image_hosting', false, false, false, true, true, false, 'https://imgur.com/'),
  ('Google Photos', 'googlephotos', 'image_hosting', false, false, false, true, true, false, 'https://photos.google.com/'),

  -- Portfolio, Curation & Discovery
  ('Behance', 'behance', 'portfolio', false, false, false, true, true, true, 'https://behance.net/'),
  ('500px', '500px', 'portfolio', false, false, false, true, false, false, 'https://500px.com/'),
  ('Dropmark', 'dropmark', 'portfolio', false, false, false, true, true, true, 'https://dropmark.com/'),

  -- Community, Directory & Experiences
  ('Locanto', 'locanto', 'other', false, false, false, true, false, false, 'https://locanto.co.id/'),
  ('Klook', 'klook', 'other', false, false, false, true, false, false, 'https://www.klook.com/'),
  ('Glints', 'glints', 'other', false, false, false, true, false, false, 'https://glints.com/'),

  -- Stock Visual Platforms
  ('Pixabay', 'pixabay', 'stock_visuals', false, false, false, true, true, false, 'https://pixabay.com/'),
  ('Unsplash', 'unsplash', 'stock_visuals', false, false, false, true, false, false, 'https://unsplash.com/'),
  ('Pexels', 'pexels', 'stock_visuals', false, false, false, true, true, false, 'https://www.pexels.com/id-id/')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  portal_url = EXCLUDED.portal_url,
  api_enabled = EXCLUDED.api_enabled,
  oauth_enabled = EXCLUDED.oauth_enabled,
  publish_enabled = EXCLUDED.publish_enabled;

-- ------------------------------------------------------------------------------
-- 18. Enable Row Level Security (RLS) Policies
-- ------------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view platforms
CREATE POLICY "Public Read Platforms" ON public.platforms FOR SELECT TO authenticated USING (true);
