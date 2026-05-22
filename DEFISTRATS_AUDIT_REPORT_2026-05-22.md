# DeFiStrats Audit Report

Date: 2026-05-22
Workspace: `/Users/jojo/Desktop/Defistrats`
Production URL: `https://hyperliquid.solidmetrics.co`
Supabase project: `defistrats-hyperliquid` (`cnjsruydumsnacyvmgje`)
Auditor: Codex

## 1. Executive Summary

DeFiStrats is operational again on Vercel and connected to the restored Supabase project. The public site, admin login route, sitemap route, TypeScript check, and production build all complete successfully. The restored database is usable: 105 published staking assets are present, one admin profile exists, RLS is enabled across the public application tables, and the baseline migration is applied remotely.

The project is not yet in a clean production-hardening state. The highest-risk issues are:

1. A Firecrawl API key is hardcoded in frontend source code and should be rotated immediately.
2. Several scraper Edge Functions are public (`verify_jwt = false`) while using service-role access internally. They can mutate production staking asset data if the required scraper secret is added.
3. Strategy descriptions are stored and rendered as raw HTML with `dangerouslySetInnerHTML`, creating stored XSS risk.
4. Admin profile RLS permits any admin to update or delete profile rows, which is broader than the UI privilege model.
5. Dependency audit currently reports 73 production vulnerabilities, including critical and high severity transitive issues.
6. The restored data is functional but stale: 59 assets have zero APY, 70 have zero TVL, all APY/TVL configs have never scraped in the new project, and one duplicate strategy grouping exists.

Recommended order: rotate/remove exposed secrets first, lock down scraper functions, add HTML sanitization, tighten admin RLS, then clean dependency and data-quality issues.

## 2. Audit Scope

Reviewed:

- React/Vite application source under `src/`
- Supabase migrations, Edge Functions, and local config under `supabase/`
- Public static files under `public/`
- Project config files, package metadata, Vercel env names, and docs
- Live Supabase schema, policies, counts, advisors, functions, secrets list, and data health
- Live deployment reachability for the production URL
- Build, TypeScript, lint, dependency audit, and dependency freshness

Excluded from source review:

- `node_modules/`
- generated `dist/`
- raw local Supabase temp files and ignored local env files
- legacy export raw content except where it affects current restored schema/data

No secret values are included in this report. Any discovered key material is described only by location and redacted.

## 3. Current System State

### Production

- `https://hyperliquid.solidmetrics.co/` returns HTTP 200 from Vercel.
- `https://hyperliquid.solidmetrics.co/admin/login` returns HTTP 200 through the SPA fallback.
- `https://hyperliquid.solidmetrics.co/sitemap.xml` returns HTTP 200.
- Vercel Production environment variables exist for:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

### Supabase

- Project ref: `cnjsruydumsnacyvmgje`
- Baseline migration applied locally and remotely: `20260522000000`
- Active Edge Functions:
  - `create-admin-user`
  - `scrape-data`
  - `schedule-scrapers`
  - `scrape-apy-tvl`
  - `track-analytics`
- Supabase secrets currently list only platform defaults. No `FIRECRAWL_API_KEY` is configured in Supabase yet.

### Local Workspace

- Current folder is not a git repository. Git operations should be done from the GitHub clone or by re-cloning `joshavenue/defistrats`.
- `.gitignore` and `.vercelignore` correctly exclude local env files, `.vercel`, Supabase temp files, and local-only artifacts.

## 4. Architecture Inventory

### Frontend

- React 18 + TypeScript + Vite
- React Router DOM for routing
- TanStack Query for server-state fetching/caching
- shadcn/ui + Tailwind for UI
- Supabase JS client for database/auth/storage
- Web3-related packages present: Wagmi, Viem, Privy, Moralis, Reown-related transitive packages

### Backend

- Supabase Postgres with RLS
- Supabase Auth for admin login
- Supabase Storage bucket for asset logos
- Supabase Edge Functions for admin creation, scraping, scheduled scraping, and analytics

### Main Database Tables

- `staking_assets`
- `profiles`
- `admin_requests`
- `apy_tvl_configs`
- `scraper_configs`
- `scraper_logs`
- `page_views`
- `link_clicks`
- `active_sessions`
- `app_config`
- `banners`
- `livestream_videos`

## 5. Database Audit

### Table Counts

| Table | Rows |
|---|---:|
| `staking_assets` | 105 |
| `profiles` | 1 |
| `admin_requests` | 0 |
| `apy_tvl_configs` | 44 |
| `scraper_configs` | 3 |
| `scraper_logs` | 0 |
| `page_views` | 13 |
| `link_clicks` | 0 |
| `active_sessions` | 2 |
| `app_config` | 0 |
| `banners` | 1 |
| `livestream_videos` | 1 |

### RLS Status

RLS is enabled on all reviewed public application tables and `storage.objects`.

Policy count by table:

| Table | Policy Count |
|---|---:|
| `profiles` | 5 |
| `staking_assets` | 5 |
| `active_sessions` | 3 |
| `admin_requests` | 3 |
| `app_config` | 2 |
| `banners` | 2 |
| `link_clicks` | 2 |
| `livestream_videos` | 2 |
| `page_views` | 2 |
| `apy_tvl_configs` | 1 |
| `scraper_configs` | 1 |
| `scraper_logs` | 1 |
| `storage.objects` | 4 |

### Supabase Security Advisor Findings

Important warnings from Supabase advisors:

- `active_sessions` has broad anonymous/authenticated insert/update policies.
- `page_views` and `link_clicks` allow anonymous inserts.
- Public `asset-logos` bucket policy allows object listing.
- Leaked password protection is disabled.
- MFA options are insufficient.

The analytics write policies are probably intentional, but they need rate limiting, input validation, and abuse protection if the site receives meaningful traffic.

### Supabase Performance Advisor Findings

Important warnings:

- Unindexed foreign keys:
  - `admin_requests.reviewed_by`
  - `admin_requests.user_id`
  - `banners.created_by`
  - `banners.updated_by`
  - `livestream_videos.created_by`
  - `livestream_videos.updated_by`
  - `scraper_configs.asset_id`
  - `scraper_logs.asset_id`
- RLS policies call `auth.uid()` or helper functions in ways Supabase flags for initplan/per-row optimization.
- Multiple permissive policies exist on several tables.
- Some indexes are marked unused, likely because this is a freshly rebuilt project.

### Extensions

The audit found no installed `pg_cron`, `pg_net`, `http`, `pg_graphql`, or `vector` extensions. Scraping is therefore not currently scheduled through Postgres cron.

## 6. Data Quality Audit

### Staking Assets

| Metric | Value |
|---|---:|
| Total assets | 105 |
| Published assets | 105 |
| Draft assets | 0 |
| Featured assets | 4 |
| Missing protocol name | 0 |
| Missing asset field | 78 |
| Missing symbol field | 78 |
| Missing protocol logo | 0 |
| Missing asset logo | 0 |
| Missing CTA link | 0 |
| CTA links without protocol | 96 |

Most CTA links are stored as domain/path values without `https://`. Some components normalize these before opening, but storing canonical URLs would reduce edge cases and simplify link handling.

### APY and TVL

| Metric | Value |
|---|---:|
| Minimum APY | 0 |
| Median APY | 0 |
| Maximum APY | 236 |
| Assets with zero APY | 59 |
| Minimum TVL | 0 |
| Median TVL | 0 |
| Maximum TVL | 132,570,000 |
| Assets with zero TVL | 70 |
| Assets with both APY and TVL above zero | 35 |

The highest observed APY is 236 for `gLiquid HYPE/USDhl LP`. This may be legitimate for DeFi yield, but it should be manually verified before being treated as current.

### Risk Distribution

| Risk | Count |
|---|---:|
| Low | 60 |
| Medium | 26 |
| High | 19 |

### Strategy Type Distribution

| Strategy Type | Count |
|---|---:|
| LST/Earn/Hold | 56 |
| LP | 18 |
| Trading | 14 |
| Borrow/Lending | 12 |
| Bridge | 4 |
| Crypto Card | 1 |

### Scraper Configs

`apy_tvl_configs`:

- 44 total
- 33 active
- 44 never scraped in the restored project
- 1 missing target
- 6 target URLs without protocol
- 0 orphan configs

`scraper_configs`:

- 3 total
- 2 active
- 2 never scraped in the restored project
- 1 target URL without protocol
- 0 orphan configs

### Duplicates

One duplicate strategy grouping was found:

- Protocol: `HypurrFi`
- Asset: `HYPE`
- Symbol: `USDT`
- Strategy type: `Borrow/Lending`
- Duplicate rows: 2

One of the duplicate CTA links has trailing whitespace.

### Current HTML Content Scan

A database pattern scan found 0 current `strategy_description` rows containing these suspicious fragments:

- `<script`
- `onerror=`
- `onload=`
- `javascript:`

This is good, but it does not remove the code-level stored XSS risk because future admin-entered HTML can still be stored and rendered unsanitized.

## 7. Security Findings

### Critical: Firecrawl API Key Is Hardcoded in Frontend Source

Evidence:

- `src/utils/firecrawl.ts:3-5`
- `src/components/APYTVLFetcher.tsx` calls the frontend Firecrawl utility
- `src/components/AdminDataTable.tsx` imports/uses the same utility for batch fetches

Risk:

- Any key in Vite frontend source is client-exposed after build.
- The current key should be considered compromised.
- Attackers can consume quota or scrape using the project key.

Recommended fix:

1. Rotate the Firecrawl key immediately.
2. Delete the frontend Firecrawl client utility.
3. Move all Firecrawl calls to a JWT-protected Supabase Edge Function.
4. Add `FIRECRAWL_API_KEY` as a Supabase secret only after function auth is fixed.
5. Avoid logging full scraped HTML or key-related request metadata.

### Critical: Public Scraper Edge Functions Can Use Service Role Internally

Evidence:

- `supabase/config.toml:69-76`
- `supabase/functions/scrape-data/index.ts`
- `supabase/functions/schedule-scrapers/index.ts`
- `supabase/functions/scrape-apy-tvl/index.ts`

Current config:

- `scrape-data`: `verify_jwt = false`
- `scrape-apy-tvl`: `verify_jwt = false`
- `schedule-scrapers`: `verify_jwt = false`

Risk:

- `scrape-data` creates a service-role Supabase client internally.
- It accepts input such as `assetId` / test config and updates `staking_assets`.
- If `FIRECRAWL_API_KEY` is later added before auth is fixed, unauthenticated callers can trigger scrapes, burn API quota, and mutate production APY/TVL data.

Recommended fix:

1. Set `verify_jwt = true` for data-mutating scraper functions.
2. Enforce an admin check inside each function using the caller JWT.
3. Keep a separate private scheduled endpoint or signed cron secret for scheduled jobs.
4. Validate `assetId` ownership/existence and allowed scrape targets.
5. Add basic rate limiting and structured error logging.

### High: Stored HTML XSS Risk in Strategy Descriptions

Evidence:

- `src/components/ui/rich-text-editor.tsx:43`
- `src/pages/StrategyDetail.tsx:321`
- `src/components/StrategyModal.tsx:212`
- `src/components/MobileDataCard.tsx:162`
- `src/components/ExpandableDataTableRow.tsx:203`

Risk:

- The editor stores raw HTML with `editor.getHTML()`.
- Several components render that content with `dangerouslySetInnerHTML`.
- Current data scan did not find obvious malicious patterns, but any future compromised admin account or imported legacy content could create stored XSS.

Recommended fix:

1. Add an allowlist sanitizer such as DOMPurify before saving and again before rendering.
2. Restrict allowed tags to the TipTap subset actually used.
3. Strip event attributes, inline scripts, `javascript:` URLs, and unknown attributes.
4. Consider storing structured rich-text JSON rather than raw HTML.

### High: Admin Profile RLS Is Broader Than UI Privileges

Evidence:

- `supabase/migrations/20260522000000_rebuild_baseline.sql:295-304`

Current policy:

- Any admin can update profiles.
- Any admin can delete profiles.

Risk:

- The UI appears to reserve user-management privileges for superadmins, but RLS allows any admin to update or delete profile rows.
- A malicious or compromised admin could potentially modify role flags or remove profiles directly through the API.

Recommended fix:

1. Restrict role flag updates and profile deletes to `app_private.is_superadmin()`.
2. Add a separate self-update policy only for harmless profile fields.
3. Add database constraints or trigger validation preventing non-superadmins from setting `is_admin` or `is_superadmin`.

### High: Production Dependency Vulnerabilities

Evidence:

- `npm audit --omit=dev --json`

Result:

- 73 production dependency vulnerabilities
- 2 critical
- 13 high
- 39 moderate
- 19 low

Notable areas:

- `react-router-dom` / React Router advisory chain
- `sha.js` critical transitive issue
- `postcss`
- `@privy-io/react-auth`
- `@wagmi/connectors`
- `wagmi`
- `viem`
- `moralis`

Recommended fix:

1. Upgrade patch/minor versions first where compatible.
2. Upgrade `react-router-dom` within v6 immediately, then assess v7 separately.
3. Update Web3 stack packages together to avoid connector/runtime breakage.
4. Re-run `npm audit --omit=dev`, `npm run build`, and wallet/auth smoke tests.

### Medium: Auth Configuration Is Too Permissive for Production Admin Use

Evidence:

- `supabase/config.toml:54-64`
- Supabase advisor warnings

Current state:

- Signup enabled.
- Email signup enabled.
- Email confirmations disabled.
- Secure password change disabled.
- Password minimum length is 8.
- No password complexity requirements.
- Leaked password protection disabled.
- MFA options insufficient.

Recommended fix:

1. Disable public signup if admin accounts are manually managed.
2. Enable leaked password protection in Supabase Auth.
3. Enable stronger password requirements.
4. Require email confirmations if public signup remains enabled.
5. Require MFA for admin/superadmin accounts where possible.

### Medium: Anonymous Analytics Writes Are Abusable

Evidence:

- `supabase/migrations/20260522000000_rebuild_baseline.sql:366-395`
- `supabase/functions/track-analytics`

Risk:

- `page_views`, `link_clicks`, and `active_sessions` allow anonymous inserts/updates with broad checks.
- This is expected for analytics, but it can be spammed directly through the public anon key.

Recommended fix:

1. Prefer Edge Function writes with input validation and rate limiting.
2. Add reasonable length and enum constraints for tracked fields.
3. Consider hashing session identifiers and limiting updates to matching session keys.

### Medium: Public Storage Bucket Allows Listing

Evidence:

- Supabase security advisor
- `asset-logos` bucket is public
- `storage.objects` has broad public read policy for the bucket

Risk:

- Public reads are needed for logos, but object listing may expose all uploaded filenames.

Recommended fix:

1. Keep public object reads if needed.
2. Restrict list operations where possible.
3. Use non-sensitive, normalized object names.

### Medium: App Config Pattern Can Leak Secrets to Admin Clients

Evidence:

- `supabase/migrations/20260522000000_rebuild_baseline.sql:402-411`
- `src/utils/moralis.ts`

Current state:

- `app_config` currently has 0 rows.

Risk:

- If API keys are stored in `app_config` and read by admin clients, they become browser-visible to admins.
- Some APIs should never be exposed to any frontend code.

Recommended fix:

1. Store service API keys only in Supabase secrets or Vercel server env.
2. Route Moralis or similar privileged calls through server-side functions.
3. Keep `app_config` for non-secret display/config values only.

## 8. Application Findings

### Public Table Pagination Does Not Slice Rows

Evidence:

- `src/components/DataTable.tsx:79`
- `src/components/DataTable.tsx:175-200`

Issue:

- `totalPages` is hardcoded to 10.
- Desktop and mobile render all filtered rows instead of the current page slice.

Impact:

- Pagination UI is misleading.
- Performance will degrade as asset count grows.

Recommended fix:

- Derive `totalPages` from row count and page size.
- Slice `filteredAndSortedRows` before rendering.

### Admin Batch Fetch Uses Global Window Bridge

Evidence:

- `src/pages/AdminDatabase.tsx:24-25`
- `src/components/AdminDataTable.tsx:444-451`
- `src/components/SheetDataTable.tsx`

Issue:

- Parent batch fetch calls `window.adminTableBatchFetch`.
- The function exists only when `AdminDataTable` is mounted.
- In sheet view, fetch buttons may become no-ops.

Recommended fix:

- Lift batch-fetch state/actions into `AdminDatabase`.
- Pass handlers explicitly to table/sheet components.

### Livestream External Open Missing `noopener,noreferrer`

Evidence:

- `src/pages/Livestream.tsx:85`

Risk:

- Opening external URLs without `noopener,noreferrer` can expose the opener context.

Recommended fix:

- Change to `window.open(url, '_blank', 'noopener,noreferrer')`.

### Placeholder Image Route Does Not Exist

Evidence:

- `src/pages/AdminLivestream.tsx:183`
- `src/pages/AdminLivestream.tsx:317`
- `src/pages/Livestream.tsx:77`
- `src/pages/Livestream.tsx:167`

Issue:

- Components fallback to `/api/placeholder/400/225`.
- This Vite frontend has no local `/api/placeholder` route.

Recommended fix:

- Use a static placeholder asset under `public/`.
- Or render a CSS placeholder instead of an image URL.

### Site Password Gate Is Hardcoded

Evidence:

- `src/components/SitePasswordGate.tsx:7`

Current behavior:

- The gate appears scoped to localhost/staging-style hosts.

Risk:

- If reused in production or copied into a future gate, it is trivially bypassable and source-visible.

Recommended fix:

- Remove if not needed.
- If needed, implement server-side auth or Vercel protection instead.

### Web3 Configuration Looks Incomplete

Evidence:

- `src/config/wagmi.ts` contains a placeholder WalletConnect project ID.
- Privy app ID is hardcoded in frontend code.

Impact:

- WalletConnect may not work reliably.
- Public app IDs are not necessarily secrets, but they should be environment-configured for deployment hygiene.

Recommended fix:

- Move public Web3 app IDs to `VITE_*` env vars.
- Configure a real WalletConnect project ID if that feature is intended.
- Remove unused Web3 dependencies if the DeFi testing feature is not part of the product.

### DeFi Testing Page May Be Misleading

Evidence:

- `src/pages/DeFiTesting.tsx`

Issue:

- The page uses mock strategy data while presenting a transaction/testing flow.

Recommended fix:

- Hide behind admin/dev feature flag, clearly label as testnet/demo, or remove from production routes.

## 9. SEO, Branding, and Documentation Findings

### Sitemap and Robots Still Point to DefiStrats Domain

Evidence:

- `public/robots.txt:20`
- `public/sitemap.xml`

Issue:

- URLs still point to `https://defistrats.com/...`.
- Current production domain is `https://hyperliquid.solidmetrics.co`.

Recommended fix:

- Regenerate sitemap with `https://hyperliquid.solidmetrics.co`.
- Update `robots.txt`.
- Consider whether admin URLs should be included in sitemap. Usually they should not.

### Twitter Metadata Still References Lovable

Evidence:

- `index.html:18`

Issue:

- `twitter:site` is `@lovable_dev`.

Recommended fix:

- Replace with the correct DeFiStrats/SolidMetrics handle or remove the field.

### Docs Still Contain Old Domain Guidance

Evidence:

- `SUPABASE_REBUILD.md:82`

Issue:

- It says to keep `defistrats.xyz` DNS pointed at the host, but the plan changed to let `defistrats.xyz` expire and use the `solidmetrics.co` subdomain.

Recommended fix:

- Update docs to reflect `hyperliquid.solidmetrics.co`.

### README Is Generic Lovable Boilerplate

Evidence:

- `README.md`

Issue:

- README does not describe DeFiStrats operations, restoration state, admin access flow, Supabase project, or deployment process.

Recommended fix:

- Replace README with a repo-specific operator guide.

### Agent 4 Update: SEO, Docs, And Data Cleanup Prepared

Status as of 2026-05-22:

- `public/robots.txt` now references `https://hyperliquid.solidmetrics.co/sitemap.xml`.
- `public/sitemap.xml` now uses `https://hyperliquid.solidmetrics.co` and excludes admin URLs.
- `index.html` no longer references `@lovable_dev`; it includes production-domain canonical, Open Graph URL, and absolute social image metadata.
- `README.md` was replaced with a DeFiStrats operator guide.
- `SUPABASE_REBUILD.md` now states that `defistrats.xyz` is being allowed to expire and `hyperliquid.solidmetrics.co` is production.
- `docs/data-quality-and-backup-runbook.md` documents URL cleanup SQL, duplicate review, stale APY/TVL review, and Supabase export/backup steps.
- `supabase/migrations/20260522091230_normalize_agent4_data_urls.sql` prepares conservative URL normalization for CTA and scraper target fields. It has not been applied by Agent 4.

## 10. Build, Lint, and Dependency Audit

### TypeScript

Command:

```bash
npx tsc --noEmit
```

Result:

- Passed with exit code 0.

### Production Build

Command:

```bash
npm run build
```

Result:

- Passed with exit code 0.

Warnings:

- Browserslist/caniuse-lite is outdated.
- Rollup emitted many pure annotation warnings from Web3 dependencies.
- Browser build externalized Node core modules such as `assert` and `stream` from Ethereum/Web3 dependency chains.
- Bundle size is large.

Largest generated asset:

- `dist/assets/index-DuhRurT5.js`: 4,892.37 kB, 1,384.13 kB gzip

Recommended fix:

- Remove unused Web3 libraries if possible.
- Lazy-load heavy wallet/testing routes.
- Run bundle analysis after dependency cleanup.

### ESLint

Command:

```bash
npm run lint
```

Result:

- Failed with 65 problems.
- 51 errors.
- 14 warnings.

Common categories:

- `@typescript-eslint/no-explicit-any`
- unused expressions
- missing React hook dependencies
- empty interfaces
- `require()` usage in Tailwind config
- linting included Supabase Edge Function files with frontend ESLint assumptions

Recommended fix:

1. Split ESLint config for browser TS/TSX and Supabase Edge Function Deno files.
2. Fix actual frontend lint errors before treating warnings.
3. Keep generated Supabase types excluded if they create noise.

### Dependency Freshness

Notable stale packages:

- `@supabase/supabase-js`: `2.50.2` installed, `2.106.1` latest
- `@privy-io/react-auth`: `3.0.0` installed, `3.27.1` latest
- `react-router-dom`: `6.27.0` installed, `6.30.3` wanted, `7.15.1` latest
- `vite`: `5.4.10` installed, `5.4.21` wanted, `8.0.14` latest
- Multiple Radix, TanStack, Wagmi, Viem, and UI packages are outdated

Recommended fix:

- Do not bulk-major-upgrade everything at once.
- First do compatible patch/minor upgrades and verify build/runtime.
- Then plan larger migrations, especially React Router v7 and Vite v8.

## 11. Positive Findings

- Production deployment is reachable on the new subdomain.
- Supabase project link and migration state are clean.
- Main migration is applied remotely and locally.
- RLS is enabled on the reviewed application tables.
- Public reads for published staking assets are correctly separated from admin management policies.
- `create-admin-user` requires JWT verification and checks superadmin status before using service-role admin operations.
- TypeScript compile check passes.
- Production build succeeds.
- Ignored local secret/temp patterns are present in `.gitignore` and `.vercelignore`.
- Current restored rich text data does not contain obvious script/event-handler patterns from the sampled SQL scan.

## 12. Recommended Remediation Plan

### Immediate, Same Day

1. Rotate the exposed Firecrawl API key.
2. Remove the frontend Firecrawl client from `src/utils/firecrawl.ts`.
3. Set scraper data-mutating functions to require JWT.
4. Add server-side admin validation to scraper functions before they use service-role writes.
5. Do not add `FIRECRAWL_API_KEY` to Supabase secrets until scraper auth is fixed.
6. Add sanitization around rich text save/render paths.
7. Update `robots.txt`, `sitemap.xml`, and obvious stale domain metadata.

### Next 3-7 Days

1. Tighten profile RLS so only superadmins can change role flags or delete profiles.
2. Add missing foreign-key indexes flagged by Supabase performance advisors.
3. Fix public table pagination.
4. Fix admin batch fetch state flow.
5. Clean lint errors or adjust ESLint scope for Edge Functions.
6. Upgrade high-impact vulnerable dependencies within compatible version ranges.
7. Canonicalize CTA and scraper target URLs in the database.
8. Deduplicate the HypurrFi HYPE/USDT Borrow/Lending row.

### Later

1. Decide whether Web3 testing/wallet features are part of the product. Remove or lazy-load if not.
2. Build a proper scraping scheduler with rate limits and logs.
3. Add a small automated test suite for:
   - public asset listing
   - admin login guard
   - asset edit/save
   - rich text sanitization
   - scraper function authorization
4. Replace README with an operator runbook.
5. Add dependency maintenance cadence.
6. Add backup/export runbook for Supabase data.

## 13. Suggested First Fix Set

For the lowest-risk, highest-impact first patch:

1. Delete `src/utils/firecrawl.ts` usage from frontend admin components.
2. Update scraper Edge Function auth in `supabase/config.toml`.
3. Add a shared sanitizer for strategy descriptions.
4. Fix `robots.txt` and `sitemap.xml` to use `https://hyperliquid.solidmetrics.co`.
5. Patch `Livestream.tsx` external window open.
6. Fix public table pagination.

After that patch, run:

```bash
npm run lint
npx tsc --noEmit
npm run build
npx supabase db advisors --linked --type security
npx supabase db advisors --linked --type performance
```

## 14. Verification Commands Run

Supabase:

```bash
npx supabase --version
npx supabase db --help
npx supabase db query --help
npx supabase db advisors --help
npx supabase migration list --linked
npx supabase functions list
npx supabase secrets list
npx supabase db advisors --linked --type security
npx supabase db advisors --linked --type performance
npx supabase db query --linked "<audit SQL queries>"
```

Frontend/build:

```bash
npx tsc --noEmit
npm run build
npm run lint
npm audit --omit=dev --json
npm outdated --json
```

Production reachability:

```bash
curl -I -L https://hyperliquid.solidmetrics.co/
curl -I -L https://hyperliquid.solidmetrics.co/admin/login
curl -I -L https://hyperliquid.solidmetrics.co/sitemap.xml
curl -s https://hyperliquid.solidmetrics.co/robots.txt
```

## 15. Evidence Index

| Area | Evidence |
|---|---|
| Supabase project ref | `supabase/config.toml:1` |
| Auth config | `supabase/config.toml:43-68` |
| Public scraper functions | `supabase/config.toml:69-76` |
| Admin creator function is JWT-verified | `supabase/config.toml:81-82` |
| Hardcoded Firecrawl key | `src/utils/firecrawl.ts:3-5` |
| Raw rich text save | `src/components/ui/rich-text-editor.tsx:43` |
| Raw rich text render | `src/pages/StrategyDetail.tsx:321`, `src/components/StrategyModal.tsx:212`, `src/components/MobileDataCard.tsx:162`, `src/components/ExpandableDataTableRow.tsx:203` |
| Broad profile update/delete RLS | `supabase/migrations/20260522000000_rebuild_baseline.sql:295-304` |
| Anonymous analytics policies | `supabase/migrations/20260522000000_rebuild_baseline.sql:366-395` |
| App config admin read | `supabase/migrations/20260522000000_rebuild_baseline.sql:402-405` |
| Hardcoded pagination count | `src/components/DataTable.tsx:79` |
| Public table renders all rows | `src/components/DataTable.tsx:175-200` |
| Admin batch fetch global | `src/pages/AdminDatabase.tsx:24-25`, `src/components/AdminDataTable.tsx:444-451` |
| Livestream external open | `src/pages/Livestream.tsx:85` |
| Missing placeholder route usage | `src/pages/Livestream.tsx:77`, `src/pages/AdminLivestream.tsx:183` |
| Stale robots sitemap URL | `public/robots.txt:20` |
| Stale sitemap URLs | `public/sitemap.xml` |
| Stale Twitter metadata | `index.html:18` |
| Stale rebuild doc domain | `SUPABASE_REBUILD.md:82` |
