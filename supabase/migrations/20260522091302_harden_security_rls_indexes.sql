-- Harden profile role management, storage listing, and advisor-flagged FK indexes.

create or replace function app_private.protect_profile_sensitive_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('request.jwt.claim.role', true) = 'service_role' then
    return new;
  end if;

  if app_private.is_superadmin(auth.uid()) then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.email is distinct from old.email
    or new.is_admin is distinct from old.is_admin
    or new.is_superadmin is distinct from old.is_superadmin
    or new.created_at is distinct from old.created_at then
    raise exception 'Only superadmins can update profile identity or role fields';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_sensitive_fields on public.profiles;
create trigger protect_profile_sensitive_fields
before update on public.profiles
for each row execute function app_private.protect_profile_sensitive_fields();

drop policy if exists "Admins can update profiles" on public.profiles;
drop policy if exists "Admins can delete profiles" on public.profiles;
drop policy if exists "Users can update own profile basic fields" on public.profiles;
drop policy if exists "Superadmins can update profiles" on public.profiles;
drop policy if exists "Superadmins can delete profiles" on public.profiles;

create policy "Users can update own profile basic fields"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "Superadmins can update profiles"
on public.profiles for update
to authenticated
using ((select app_private.is_superadmin()))
with check ((select app_private.is_superadmin()));

create policy "Superadmins can delete profiles"
on public.profiles for delete
to authenticated
using ((select app_private.is_superadmin()));

create index if not exists idx_admin_requests_reviewed_by on public.admin_requests(reviewed_by);
create index if not exists idx_admin_requests_user_id on public.admin_requests(user_id);
create index if not exists idx_banners_created_by on public.banners(created_by);
create index if not exists idx_banners_updated_by on public.banners(updated_by);
create index if not exists idx_livestream_videos_created_by on public.livestream_videos(created_by);
create index if not exists idx_livestream_videos_updated_by on public.livestream_videos(updated_by);
create index if not exists idx_scraper_configs_asset_id on public.scraper_configs(asset_id);
create index if not exists idx_scraper_logs_asset_id on public.scraper_logs(asset_id);

drop policy if exists "Public read access to asset logos" on storage.objects;
drop policy if exists "Public can download asset logos" on storage.objects;
drop policy if exists "Admins can select asset logos" on storage.objects;

create policy "Public can download asset logos"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'asset-logos'
  and storage.allow_any_operation(array[
    'storage.object.get_public',
    'storage.object.info_public',
    'storage.render.image_public'
  ])
);

create policy "Admins can select asset logos"
on storage.objects for select
to authenticated
using (
  bucket_id = 'asset-logos'
  and (select app_private.is_admin())
);
