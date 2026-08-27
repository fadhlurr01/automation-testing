alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check check (role in ('OWNER', 'ADMIN', 'EDITOR', 'APPROVER', 'VIEWER'));
alter table public.users alter column role set default 'OWNER';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  workspace_name text;
  workspace_slug text;
  organization_id uuid;
begin
  workspace_name := coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1), 'New user') || ' Workspace';
  workspace_slug := regexp_replace(lower(workspace_name), '[^a-z0-9]+', '-', 'g') || '-' || substr(new.id::text, 1, 8);

  insert into public.organizations (name, slug)
  values (workspace_name, workspace_slug)
  returning id into organization_id;

  insert into public.users (id, organization_id, full_name, role)
  values (new.id, organization_id, nullif(new.raw_user_meta_data->>'full_name', ''), 'OWNER');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.has_org_role(required_roles text[])
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = any(required_roles)
  );
$$;

create policy "owners admins manage organization users" on public.users for update using (public.is_org_member(organization_id) and public.has_org_role(array['OWNER', 'ADMIN'])) with check (public.is_org_member(organization_id));
