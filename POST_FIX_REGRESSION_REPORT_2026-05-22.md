# DeFiStrats Post-Fix Regression Report

Date: 2026-05-22  
Production URL: `https://hyperliquid.solidmetrics.co`  
Vercel deployment: `dpl_8K1pjoPzqHhjmE9xWaNoRS4gjA4L`  
Final gate: `GO WITH RISKS`

## Release Result

No remaining release blockers were found after the 5-agent fix pass, Supabase migration push, Edge Function deploy, and Vercel production deploy.

## Live Changes Applied

- Applied Supabase migrations:
  - `20260522091230_normalize_agent4_data_urls.sql`
  - `20260522091302_harden_security_rls_indexes.sql`
- Set a new random `SCRAPER_CRON_SECRET` Supabase secret without printing the value.
- Deployed Edge Functions:
  - `scrape-data`
  - `scrape-apy-tvl`
  - `schedule-scrapers`
  - `track-analytics`
- Deployed Vercel production:
  - `https://defistrats-iiy2so06n-jojos-projects-0691bf9b.vercel.app`
  - aliased to `https://hyperliquid.solidmetrics.co`

## Confirmed Fixed

- Hardcoded Firecrawl frontend key removed from source and built assets.
- Direct frontend Firecrawl SDK dependency removed from `package.json` and `package-lock.json`.
- `scrape-apy-tvl` and `scrape-data` reject unauthenticated calls with `401`.
- `schedule-scrapers` rejects calls without the cron secret with `401`.
- Rich-text strategy render paths use `sanitizeRichTextHtml`.
- Public `DataTable` pagination now slices rows.
- Global `window.adminTableBatchFetch` bridge is removed.
- `/api/placeholder/400/225` references are gone.
- `SitePasswordGate` is removed.
- Profile role mutation is protected by superadmin RLS and a trigger.
- Missing FK indexes from the audit were added.
- Public asset-logo listing warning was removed from Supabase security advisors.
- CTA/scraper URL cleanup migration applied.
- `robots.txt` and `sitemap.xml` use `https://hyperliquid.solidmetrics.co`.
- Sitemap no longer includes admin URLs.
- Stale `@lovable_dev` metadata was removed.

## Verification Summary

Passed:

```bash
npm run lint
npx tsc --noEmit
npm run build
npx supabase migration list --linked
npx supabase functions list
```

Production smoke checks passed:

```bash
curl -L https://hyperliquid.solidmetrics.co/
curl -L https://hyperliquid.solidmetrics.co/admin/login
curl -L https://hyperliquid.solidmetrics.co/livestream
curl -L https://hyperliquid.solidmetrics.co/btc-bridge
curl https://hyperliquid.solidmetrics.co/robots.txt
curl https://hyperliquid.solidmetrics.co/sitemap.xml
```

Security checks:

- Old Firecrawl key/package/source references: `0` matches.
- Production scraper endpoints without auth: `401`.
- Scheduler without cron secret: `401`.
- Supabase remote migrations match local.

## Remaining Risks

- `npm audit --omit=dev` still reports 51 production vulnerabilities:
  - 0 critical
  - 0 high
  - 33 moderate
  - 18 low
- Remaining dependency risk is mostly Web3, wallet, and Moralis transitive packages.
- Supabase security advisors still warn about:
  - permissive analytics/session policies on `active_sessions`, `page_views`, and `link_clicks`
  - leaked-password protection disabled
  - insufficient MFA options
- Supabase performance advisors still warn about:
  - some RLS initplan patterns
  - multiple permissive policy patterns
- Build still warns about the large `web3-wallet` chunk, around 4.35 MB minified.
- Admin table page counter increments but rows are not sliced inside `AdminDataTable`; public listing pagination is fixed.
- Browser DOM automation was not run because Playwright was not available in the local runtime. Production verification used curl, source inspection, build, and Supabase checks.

## Manual Follow-Up

1. Rotate the old exposed Firecrawl key in Firecrawl.
2. Add the new rotated key as Supabase secret `FIRECRAWL_API_KEY`.
3. Enable Supabase leaked-password protection.
4. Enable or require MFA for admin/superadmin accounts.
5. Decide whether anonymous analytics/session writes should be rate-limited or moved behind an Edge Function.
6. Schedule a Web3/Moralis cleanup pass to reduce remaining audit findings and bundle size.
7. Review the duplicate HypurrFi HYPE/USDT Borrow/Lending strategy before deleting or unpublishing either row.

