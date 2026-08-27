alter table public.content_items
  add column if not exists facts jsonb not null default '{}'::jsonb,
  add column if not exists seo_title text,
  add column if not exists seo_description text;