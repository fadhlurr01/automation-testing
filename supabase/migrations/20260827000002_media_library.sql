alter table public.media_assets
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists duration numeric,
  add column if not exists thumbnail_url text;

insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do update set public = false;

create policy "users can upload own media objects" on storage.objects for insert to authenticated
with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users can read own media objects" on storage.objects for select to authenticated
using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users can update own media objects" on storage.objects for update to authenticated
using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users can delete own media objects" on storage.objects for delete to authenticated
using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create index if not exists media_assets_user_created_at_idx on public.media_assets(user_id, created_at desc);
