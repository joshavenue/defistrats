-- Remove feature surfaces retired on 2026-05-23:
-- - public/admin livestream pages
-- - Brotocol/BroBridge widget and BTC bridge page
-- The BTC row is preserved as draft content instead of deleted.

update public.staking_assets
set
  status = 'draft',
  updated_at = now()
where id = 'e61ca80d-b7f0-449f-a4a3-6d7d29e6e5c3'
  and (
    strategy_description ilike '%brotocol%'
    or cta_link ilike '%brotocol%'
  );

drop table if exists public.livestream_videos cascade;
