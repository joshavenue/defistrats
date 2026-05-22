-- Agent 4 data cleanup for restored DeFiStrats content.
--
-- Scope:
-- - Normalize CTA and scraper target URLs to canonical https:// values where safe.
-- - Trim trailing/leading whitespace from web URL fields.
-- - Do not delete or unpublish duplicate business content.
-- - Do not invent missing scraper targets.
--
-- Expected live counts before this migration on 2026-05-22:
-- - staking_assets.cta_link: 6 rows with leading/trailing whitespace, 6 http:// rows,
--   96 rows missing a web protocol.
-- - apy_tvl_configs.target_website: 5 rows missing a web protocol, 1 blank target.
-- - scraper_configs.target_website: 1 row missing a web protocol.
-- - banners and livestream_videos URL fields: 0 malformed rows found.

begin;

update public.staking_assets
set cta_link = case
  when btrim(cta_link) ~* '^http://' then regexp_replace(btrim(cta_link), '^http://', 'https://', 'i')
  when btrim(cta_link) ~* '^(https://|mailto:|tel:)' then btrim(cta_link)
  when btrim(cta_link) = '' then btrim(cta_link)
  else 'https://' || btrim(cta_link)
end
where cta_link is not null
  and (
    cta_link <> btrim(cta_link)
    or btrim(cta_link) ~* '^http://'
    or (
      btrim(cta_link) <> ''
      and btrim(cta_link) !~* '^(https?://|mailto:|tel:)'
    )
  );

update public.apy_tvl_configs
set target_website = case
  when btrim(target_website) ~* '^http://' then regexp_replace(btrim(target_website), '^http://', 'https://', 'i')
  when btrim(target_website) ~* '^https://' then btrim(target_website)
  when btrim(target_website) = '' then btrim(target_website)
  else 'https://' || btrim(target_website)
end
where target_website is not null
  and (
    target_website <> btrim(target_website)
    or btrim(target_website) ~* '^http://'
    or (
      btrim(target_website) <> ''
      and btrim(target_website) !~* '^https?://'
    )
  );

update public.scraper_configs
set target_website = case
  when btrim(target_website) ~* '^http://' then regexp_replace(btrim(target_website), '^http://', 'https://', 'i')
  when btrim(target_website) ~* '^https://' then btrim(target_website)
  when btrim(target_website) = '' then btrim(target_website)
  else 'https://' || btrim(target_website)
end
where target_website is not null
  and (
    target_website <> btrim(target_website)
    or btrim(target_website) ~* '^http://'
    or (
      btrim(target_website) <> ''
      and btrim(target_website) !~* '^https?://'
    )
  );

-- Business review required, not automatically changed:
-- Duplicate HypurrFi HYPE/USDT Borrow/Lending rows:
-- - 0dbab33e-a375-4fb9-9122-ede0a48685ea
-- - 92c716c0-9a5d-4d9c-9660-55ce7fc02113
-- Both rows remain published until a content owner chooses which one to keep.

commit;
