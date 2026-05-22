# DeFiStrats Operator Guide

DeFiStrats is a React/Vite application for publishing HyperEVM and Hyperliquid DeFi strategies. The current production domain is:

- Production: `https://hyperliquid.solidmetrics.co`
- Retiring domain: `defistrats.xyz` is being allowed to expire and should not be used for new SEO, DNS, or docs references.
- Supabase project: `defistrats-hyperliquid` / `cnjsruydumsnacyvmgje`

## Stack

- React 18, TypeScript, Vite
- shadcn/ui and Tailwind CSS
- Supabase Postgres, Auth, Storage, RLS, and Edge Functions
- TanStack Query for server-state caching
- Vercel for frontend hosting

## Local Development

```sh
npm install
npm run dev
```

The development server runs on port `8080`.

Required frontend environment variables:

```sh
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
```

Do not put service-role keys or scraper API keys in Vite/browser environment variables.

## Verification Commands

Run these before handing off production-impacting changes:

```sh
npx tsc --noEmit
npm run build
```

Use `npm run lint` when changing TypeScript or React files. Existing dependency and lint cleanup may be handled separately by the build-health owner.

## Admin Operations

Admin routes are intentionally excluded from `public/sitemap.xml` and blocked in `public/robots.txt`.

Important routes:

- `/admin/login` - admin login
- `/admin/add` - create or edit staking assets
- `/admin/database` - manage restored staking assets
- `/admin/user` - user/admin request management
- `/admin/livestream` - livestream video management

Admin authorization is backed by the `profiles` table. Superadmin privileges are controlled with `is_superadmin`; do not update these flags from the browser or ad hoc SQL without checking RLS and audit implications.

## Data Quality Workflow

Core content lives in:

- `staking_assets`
- `apy_tvl_configs`
- `scraper_configs`
- `banners`
- `livestream_videos`

For URL cleanup, prefer a reviewed migration or SQL script over live manual edits. Current Agent 4 cleanup SQL is in `supabase/migrations/20260522091230_normalize_agent4_data_urls.sql`.

Known data review items as of 2026-05-22:

- 70 published strategies have APY or TVL set to zero and need manual refresh or scraper validation.
- The duplicate HypurrFi HYPE/USDT Borrow/Lending strategy must be resolved by a content owner before deleting or unpublishing either row.
- One `apy_tvl_configs.target_website` row is blank and needs a valid scraper target or should be disabled.

See `docs/data-quality-and-backup-runbook.md` for the exact SQL checks and backup/export process.

## Supabase Rebuild

Use `SUPABASE_REBUILD.md` when recreating the Supabase project or restoring schema/data. The rebuild runbook is conservative about secrets: service-role keys remain local or server-side only, and `FIRECRAWL_API_KEY` belongs in Supabase Edge Function secrets after scraper auth is hardened.
