-- Fresh Supabase baseline for DeFiStrats.
-- Legacy incremental migrations are archived in supabase/migrations_legacy.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists app_private;

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  is_admin boolean not null default false,
  is_superadmin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function app_private.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and (is_admin = true or is_superadmin = true)
  );
$$;

create or replace function app_private.is_superadmin(user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and is_superadmin = true
  );
$$;

revoke all on function app_private.is_admin(uuid) from public;
revoke all on function app_private.is_superadmin(uuid) from public;
grant execute on function app_private.is_admin(uuid) to anon, authenticated;
grant execute on function app_private.is_superadmin(uuid) to authenticated;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function app_private.set_updated_at();

create table if not exists public.admin_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

create table if not exists public.staking_assets (
  id uuid primary key default gen_random_uuid(),
  protocol text not null,
  chain text,
  logo text not null default '',
  asset text not null,
  symbol text not null,
  price numeric not null default 0,
  apy numeric not null default 0,
  tvl numeric,
  risk_level text default 'medium' check (risk_level in ('low', 'medium', 'high')),
  audited_by text,
  description text,
  strategy_description text,
  asset1_name text,
  asset2_name text,
  asset1_logo text,
  asset2_logo text,
  strategy_type text,
  strategy_action text,
  reward_program text,
  video_guide text,
  cta_link text,
  earn text[],
  points text,
  featured boolean not null default false,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_staking_assets_status on public.staking_assets(status);
create index if not exists idx_staking_assets_featured on public.staking_assets(featured);
create index if not exists idx_staking_assets_protocol on public.staking_assets(protocol);

create trigger set_staking_assets_updated_at
before update on public.staking_assets
for each row execute function app_private.set_updated_at();

create table if not exists public.apy_tvl_configs (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.staking_assets(id) on delete cascade,
  target_website text not null,
  target_asset1 text not null,
  apy_field_name text not null default 'APY',
  tvl_field_name text not null default 'TVL',
  apy_text_pattern text,
  tvl_text_pattern text,
  apy_context_before text,
  apy_context_after text,
  tvl_context_before text,
  tvl_context_after text,
  tvl_suffix text,
  apy_decimals integer,
  wait_delay_seconds integer default 0 check (wait_delay_seconds >= 0 and wait_delay_seconds <= 30),
  scraping_interval_hours integer not null default 24,
  is_active boolean not null default true,
  last_scraped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_apy_tvl_configs_asset_id on public.apy_tvl_configs(asset_id);

create trigger set_apy_tvl_configs_updated_at
before update on public.apy_tvl_configs
for each row execute function app_private.set_updated_at();

create table if not exists public.scraper_configs (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.staking_assets(id) on delete cascade,
  target_website text not null,
  apy_selector text,
  tvl_selector text,
  scraping_interval_hours integer not null default 24,
  is_active boolean not null default true,
  last_scraped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_scraper_configs_updated_at
before update on public.scraper_configs
for each row execute function app_private.set_updated_at();

create table if not exists public.scraper_logs (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.staking_assets(id) on delete cascade,
  scraping_type text not null,
  old_value numeric,
  new_value numeric,
  success boolean not null default true,
  error_message text,
  scraped_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  page_path text not null,
  user_agent text,
  referrer text,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index if not exists idx_page_views_created_at on public.page_views(created_at);
create index if not exists idx_page_views_session_id on public.page_views(session_id);

create table if not exists public.link_clicks (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  link_url text not null,
  link_type text not null,
  page_path text not null,
  user_agent text,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index if not exists idx_link_clicks_created_at on public.link_clicks(created_at);
create index if not exists idx_link_clicks_session_id on public.link_clicks(session_id);

create table if not exists public.active_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  page_path text not null,
  user_agent text,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_active_sessions_last_seen on public.active_sessions(last_seen);

create table if not exists public.app_config (
  id uuid primary key default gen_random_uuid(),
  key_name text not null unique,
  key_value text,
  description text,
  is_secret boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger set_app_config_updated_at
before update on public.app_config
for each row execute function app_private.set_updated_at();

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text not null,
  link_url text,
  is_active boolean default true,
  order_index integer default 0,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_banners_active_order on public.banners(is_active, order_index);

create trigger set_banners_updated_at
before update on public.banners
for each row execute function app_private.set_updated_at();

create table if not exists public.livestream_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  x_broadcast_url text not null,
  preview_image_url text,
  is_active boolean default true,
  order_index integer default 0,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_livestream_videos_active_order on public.livestream_videos(is_active, order_index);

create trigger set_livestream_videos_updated_at
before update on public.livestream_videos
for each row execute function app_private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.admin_requests enable row level security;
alter table public.staking_assets enable row level security;
alter table public.apy_tvl_configs enable row level security;
alter table public.scraper_configs enable row level security;
alter table public.scraper_logs enable row level security;
alter table public.page_views enable row level security;
alter table public.link_clicks enable row level security;
alter table public.active_sessions enable row level security;
alter table public.app_config enable row level security;
alter table public.banners enable row level security;
alter table public.livestream_videos enable row level security;

create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid() and is_admin = false and is_superadmin = false);

create policy "Users can view own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "Admins can view all profiles"
on public.profiles for select
to authenticated
using (app_private.is_admin());

create policy "Admins can update profiles"
on public.profiles for update
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Admins can delete profiles"
on public.profiles for delete
to authenticated
using (app_private.is_admin());

create policy "Users can create admin requests"
on public.admin_requests for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can view own admin requests"
on public.admin_requests for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can manage admin requests"
on public.admin_requests for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Public read access for published staking assets"
on public.staking_assets for select
to anon, authenticated
using (status = 'published');

create policy "Admins can read all staking assets"
on public.staking_assets for select
to authenticated
using (app_private.is_admin());

create policy "Admins can insert staking assets"
on public.staking_assets for insert
to authenticated
with check (app_private.is_admin());

create policy "Admins can update staking assets"
on public.staking_assets for update
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Admins can delete staking assets"
on public.staking_assets for delete
to authenticated
using (app_private.is_admin());

create policy "Admins can manage apy_tvl_configs"
on public.apy_tvl_configs for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Admins can manage scraper_configs"
on public.scraper_configs for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Admins can manage scraper_logs"
on public.scraper_logs for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Allow anonymous inserts for page views"
on public.page_views for insert
to anon, authenticated
with check (true);

create policy "Admins can view all page views"
on public.page_views for select
to authenticated
using (app_private.is_admin());

create policy "Allow anonymous inserts for link clicks"
on public.link_clicks for insert
to anon, authenticated
with check (true);

create policy "Admins can view all link clicks"
on public.link_clicks for select
to authenticated
using (app_private.is_admin());

create policy "Allow session upserts"
on public.active_sessions for insert
to anon, authenticated
with check (true);

create policy "Allow session heartbeat updates"
on public.active_sessions for update
to anon, authenticated
using (true)
with check (true);

create policy "Admins can read active sessions"
on public.active_sessions for select
to authenticated
using (app_private.is_admin());

create policy "Admin users can read app config"
on public.app_config for select
to authenticated
using (app_private.is_admin());

create policy "Superadmin users can modify app config"
on public.app_config for all
to authenticated
using (app_private.is_superadmin())
with check (app_private.is_superadmin());

create policy "Public read access for active banners"
on public.banners for select
to anon, authenticated
using (is_active = true);

create policy "Admin users can manage banners"
on public.banners for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

create policy "Public read access for active livestream videos"
on public.livestream_videos for select
to anon, authenticated
using (is_active = true);

create policy "Admin users can manage livestream videos"
on public.livestream_videos for all
to authenticated
using (app_private.is_admin())
with check (app_private.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'asset-logos',
  'asset-logos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public read access to asset logos"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'asset-logos');

create policy "Admins can upload asset logos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'asset-logos' and app_private.is_admin());

create policy "Admins can update asset logos"
on storage.objects for update
to authenticated
using (bucket_id = 'asset-logos' and app_private.is_admin())
with check (bucket_id = 'asset-logos' and app_private.is_admin());

create policy "Admins can delete asset logos"
on storage.objects for delete
to authenticated
using (bucket_id = 'asset-logos' and app_private.is_admin());

comment on column public.staking_assets.status is 'Status of the staking asset: draft rows are hidden publicly, published rows are visible.';
