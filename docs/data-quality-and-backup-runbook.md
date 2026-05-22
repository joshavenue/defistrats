# Data Quality And Backup Runbook

Production domain: `https://hyperliquid.solidmetrics.co`

`defistrats.xyz` is being allowed to expire. New metadata, sitemap entries, docs, and internal links should use the production domain above.

## URL Normalization

Use the migration at `supabase/migrations/20260522091230_normalize_agent4_data_urls.sql` to normalize CTA and scraper URLs. It is intentionally limited to mechanical changes:

- trim leading/trailing whitespace
- convert `http://` to `https://`
- add `https://` to non-empty web URLs that do not already include a protocol
- leave blank scraper targets untouched for manual review
- leave `mailto:`, `tel:`, root-relative asset paths, and already-valid HTTPS URLs alone

Before applying the migration, verify expected row counts:

```sql
select
  count(*) filter (where cta_link is not null and cta_link <> btrim(cta_link)) as cta_trailing_ws,
  count(*) filter (where cta_link ~* '^http://') as cta_http,
  count(*) filter (
    where cta_link is not null
      and btrim(cta_link) <> ''
      and btrim(cta_link) !~* '^(https?://|mailto:|tel:)'
  ) as cta_add_https
from public.staking_assets;

select
  count(*) filter (where target_website is not null and target_website <> btrim(target_website)) as apy_target_trailing_ws,
  count(*) filter (where target_website ~* '^http://') as apy_http,
  count(*) filter (
    where target_website is not null
      and btrim(target_website) <> ''
      and btrim(target_website) !~* '^https?://'
  ) as apy_add_https,
  count(*) filter (where btrim(coalesce(target_website, '')) = '') as apy_missing_target
from public.apy_tvl_configs;

select
  count(*) filter (where target_website is not null and target_website <> btrim(target_website)) as scraper_target_trailing_ws,
  count(*) filter (where target_website ~* '^http://') as scraper_http,
  count(*) filter (
    where target_website is not null
      and btrim(target_website) <> ''
      and btrim(target_website) !~* '^https?://'
  ) as scraper_add_https
from public.scraper_configs;
```

After applying, these checks should be zero except `apy_missing_target`, which currently needs manual content review:

```sql
select count(*) as bad_cta_urls
from public.staking_assets
where cta_link is not null
  and (
    cta_link <> btrim(cta_link)
    or (
      btrim(cta_link) <> ''
      and btrim(cta_link) !~* '^(https://|mailto:|tel:)'
    )
  );

select count(*) as active_scraper_targets_missing_protocol
from (
  select target_website, is_active from public.apy_tvl_configs
  union all
  select target_website, is_active from public.scraper_configs
) targets
where is_active
  and btrim(coalesce(target_website, '')) <> ''
  and btrim(target_website) !~* '^https://';
```

## Duplicate Strategy Review

The current business-review duplicate is:

- Protocol: `HypurrFi`
- Strategy type: `Borrow/Lending`
- Asset pair: `HYPE` / `USDT`
- Rows:
  - `0dbab33e-a375-4fb9-9122-ede0a48685ea`
  - `92c716c0-9a5d-4d9c-9660-55ce7fc02113`

Do not delete either row until a content owner confirms which version should remain published. The only safe mechanical difference found by Agent 4 was URL formatting: one CTA had trailing whitespace and both CTA URLs should normalize to `https://app.hypurr.fi/buddies/JOSH`.

Review query:

```sql
select
  id,
  protocol,
  asset1_name,
  asset2_name,
  strategy_type,
  apy,
  tvl,
  cta_link,
  status,
  created_at,
  updated_at
from public.staking_assets
where protocol = 'HypurrFi'
  and strategy_type = 'Borrow/Lending'
order by asset1_name, asset2_name, created_at nulls last;
```

## Stale APY/TVL Review

As of the 2026-05-22 audit, published strategy values are stale:

- 59 published assets have APY set to zero.
- 70 published assets have TVL set to zero.
- 70 published assets have APY or TVL set to zero.
- 44 APY/TVL configs and 2 active scraper configs had never scraped in the restored project at audit time.

Refresh priorities:

1. Active, published strategies with APY or TVL set to zero.
2. Featured strategies.
3. Strategies with active scraper configs whose `last_scraped_at` is null.
4. High APY outliers before using them in marketing or featured placements.

Review query:

```sql
select
  id,
  protocol,
  coalesce(nullif(asset, ''), asset1_name || ' / ' || asset2_name) as strategy_asset,
  strategy_type,
  apy,
  tvl,
  featured,
  updated_at
from public.staking_assets
where status = 'published'
  and (apy = 0 or coalesce(tvl, 0) = 0)
order by featured desc, protocol, strategy_type;
```

## Supabase Export And Backup

Create a backup before destructive cleanup, duplicate removal, rebuilds, or bulk imports:

```sh
mkdir -p backups
npx supabase db dump --linked --file backups/defistrats_schema_YYYYMMDD.sql
npx supabase db dump --linked --data-only --use-copy --file backups/defistrats_data_YYYYMMDD.sql
```

For a content-only backup, export these tables from SQL or the dashboard:

- `staking_assets`
- `apy_tvl_configs`
- `scraper_configs`
- `banners`
- `livestream_videos`

Keep exports out of git unless they have been reviewed and stripped of user data, analytics data, private URLs, and credentials.
