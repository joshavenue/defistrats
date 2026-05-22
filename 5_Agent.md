# 5-Agent Fix Plan

Date: 2026-05-22  
Project: DeFiStrats / `hyperliquid.solidmetrics.co`  
Primary audit source: `DEFISTRATS_AUDIT_REPORT_2026-05-22.md`

## Goal

Fix the audit findings in parallel without creating merge conflicts, hidden regressions, or unverified production changes.

This plan uses four implementation agents and one post-fix review agent. Each implementation agent owns a separate area. The review agent acts as the quality gate after each section is patched.

## Global Rules For All Agents

- Read `DEFISTRATS_AUDIT_REPORT_2026-05-22.md` before editing.
- Do not expose, print, commit, or paste secret values.
- Do not commit `.env*`, `.vercel/`, `supabase/.temp/`, or local-only files.
- Keep fixes scoped to the assigned area.
- Do not rewrite unrelated UI, styling, or architecture.
- Run the assigned verification commands before handing off.
- Document any unresolved issue with exact file path, line number, command output, and next step.
- If a fix requires a live credential rotation, document the required manual action instead of inventing a placeholder secret.

## Agent 1: Security + Supabase

### Mission

Remove the highest-risk backend/security issues while preserving admin access and public read access.

### Owns

- Supabase RLS policies
- Supabase Edge Function auth
- Firecrawl secret migration away from frontend code
- Supabase Auth security recommendations
- Database security/performance advisor findings
- Storage bucket policy hardening

### Primary Files

- `supabase/config.toml`
- `supabase/functions/scrape-data/index.ts`
- `supabase/functions/scrape-apy-tvl/index.ts`
- `supabase/functions/schedule-scrapers/index.ts`
- `supabase/functions/create-admin-user/index.ts`
- `supabase/functions/track-analytics/index.ts`
- `supabase/migrations/20260522000000_rebuild_baseline.sql`
- new migration files under `supabase/migrations/`
- `src/utils/firecrawl.ts`
- any frontend files that call frontend Firecrawl directly

### Tasks

1. Rotate the exposed Firecrawl key outside of code. The old key must be treated as compromised.
2. Remove direct frontend Firecrawl usage.
3. Move scraping calls to Supabase Edge Functions using `FIRECRAWL_API_KEY` from Supabase secrets.
4. Set data-mutating scraper functions to require JWT.
5. Add server-side admin validation inside scraper functions before service-role writes.
6. Separate scheduled scraping from public/manual scraping using a private cron secret or signed admin path.
7. Tighten `profiles` RLS so only superadmins can change role flags or delete profiles.
8. Add missing foreign-key indexes flagged by Supabase advisors.
9. Review anonymous analytics policies and add constraints or safer write paths where practical.
10. Restrict storage listing for `asset-logos` if public listing is not needed.

### Verification

Run:

```bash
npx supabase migration list --linked
npx supabase db advisors --linked --type security
npx supabase db advisors --linked --type performance
npx tsc --noEmit
npm run build
```

Manual checks:

- Public asset listing still loads.
- Admin login still works.
- Admin can still edit staking assets.
- Non-admin users cannot call admin-only scraper writes.
- Firecrawl key no longer appears in frontend source or build output.

### Handoff Output

- Summary of Supabase migrations created.
- List of changed function auth rules.
- Confirmation that no secret values were committed.
- Remaining advisor warnings, if any, grouped as accepted or unresolved.

## Agent 2: Frontend App Fixes

### Mission

Fix app-level bugs and unsafe rendering paths without changing product behavior unnecessarily.

### Owns

- Public data table behavior
- Admin database UI behavior
- Rich text rendering/sanitization integration
- Livestream external link safety
- Placeholder image handling
- Admin/front-end scraper UI adaptation after Agent 1 moves scraping server-side

### Primary Files

- `src/components/DataTable.tsx`
- `src/components/AdminDataTable.tsx`
- `src/components/SheetDataTable.tsx`
- `src/pages/AdminDatabase.tsx`
- `src/components/ui/rich-text-editor.tsx`
- `src/pages/StrategyDetail.tsx`
- `src/components/StrategyModal.tsx`
- `src/components/MobileDataCard.tsx`
- `src/components/ExpandableDataTableRow.tsx`
- `src/components/MetricCard.tsx`
- `src/pages/Livestream.tsx`
- `src/pages/AdminLivestream.tsx`
- shared utility files under `src/lib/` or `src/utils/`

### Tasks

1. Add allowlist HTML sanitization for strategy descriptions.
2. Sanitize before rendering all rich-text HTML.
3. Prefer sanitizing before save as well, if it does not break editor behavior.
4. Fix public table pagination so rows are sliced by current page.
5. Derive `totalPages` from filtered row count.
6. Replace global `window.adminTableBatchFetch` with explicit React state/props.
7. Make batch fetch work in both table and sheet admin views.
8. Add `noopener,noreferrer` to livestream external opens.
9. Replace `/api/placeholder/400/225` with a real static placeholder or CSS fallback.
10. Remove or harden `SitePasswordGate` if it is no longer needed.

### Verification

Run:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Browser checks:

- Home page loads.
- Asset filters still work.
- Pagination shows only the current page.
- Strategy detail page renders rich text correctly.
- Admin database view loads.
- Admin table and sheet batch fetch buttons behave consistently.
- Livestream page does not show broken placeholder images.

### Handoff Output

- List of changed UI flows.
- Screens or notes for verified pages.
- Any intentionally remaining lint warnings.

## Agent 3: Dependencies + Build Health

### Mission

Reduce dependency and build risk while keeping the app deployable.

### Owns

- `package.json`
- `package-lock.json`
- ESLint configuration
- TypeScript/build configuration where needed
- Dependency vulnerability remediation
- Bundle-size investigation

### Primary Files

- `package.json`
- `package-lock.json`
- `eslint.config.js`
- `vite.config.ts`
- `tsconfig*.json`
- `tailwind.config.ts`

### Tasks

1. Run dependency audit and identify safe patch/minor upgrades.
2. Upgrade vulnerable packages in compatible ranges first.
3. Avoid major upgrades unless required for a critical fix and verified.
4. Update `react-router-dom` within v6 before considering v7.
5. Update Supabase JS, Privy, Wagmi, Viem, Moralis, Radix, and Vite carefully.
6. Fix lint configuration so browser code and Supabase Edge Functions are linted appropriately.
7. Reduce lint errors that are not caused by config scope.
8. Investigate large Web3 chunks and recommend removals or lazy loading.

### Verification

Run:

```bash
npm install
npm audit --omit=dev
npm outdated
npm run lint
npx tsc --noEmit
npm run build
```

Manual checks:

- App still starts locally.
- Wallet/auth-related pages do not crash.
- Admin login page still renders.
- Build output does not introduce new fatal warnings.

### Handoff Output

- Packages upgraded.
- Vulnerabilities remaining and why.
- Any major-version upgrade deferred.
- Bundle-size recommendation.

## Agent 4: Data + SEO + Docs

### Mission

Clean restored content, update public-domain metadata, and make the project maintainable for future operators.

### Owns

- Restored staking asset data quality
- URL normalization
- Duplicate cleanup
- SEO files and metadata
- README/operator docs
- Rebuild/restoration documentation

### Primary Files

- `public/robots.txt`
- `public/sitemap.xml`
- `index.html`
- `README.md`
- `SUPABASE_REBUILD.md`
- `DEFISTRATS_AUDIT_REPORT_2026-05-22.md`
- optional new docs under `docs/`

### Database Areas

- `staking_assets`
- `apy_tvl_configs`
- `scraper_configs`
- `banners`
- `livestream_videos`

### Tasks

1. Update sitemap and robots from old domains to `https://hyperliquid.solidmetrics.co`.
2. Remove admin URLs from sitemap unless intentionally indexed.
3. Fix stale Twitter/Lovable metadata.
4. Update docs to say `defistrats.xyz` is being allowed to expire.
5. Replace generic README with DeFiStrats-specific operator guide.
6. Normalize CTA links and scraper target URLs to canonical `https://` URLs.
7. Remove trailing whitespace in URLs.
8. Resolve the duplicate HypurrFi HYPE/USDT Borrow/Lending strategy.
9. Flag stale APY/TVL values that need manual refresh.
10. Document how to export/backup Supabase data.

### Verification

Run:

```bash
npx tsc --noEmit
npm run build
curl -I -L https://hyperliquid.solidmetrics.co/
curl -I -L https://hyperliquid.solidmetrics.co/sitemap.xml
```

Database checks:

- No duplicate strategy groupings for protocol + asset + symbol + strategy type.
- No CTA links with trailing whitespace.
- No active scraper targets missing protocol.
- Sitemap contains only the current production domain.

### Handoff Output

- Data rows changed, with before/after summary.
- SEO files changed.
- Docs changed.
- Any data rows that require manual business review.

## Agent 5: Post-Fix Review + Regression Audit

### Mission

Act as the quality gate. Review each agent's fix, re-run the relevant audit section, and send failures back before final deployment.

### Owns

- Cross-agent coordination
- Regression audit checklist
- Final verification report
- Production smoke test after deployment
- Merge-conflict and scope review

### Must Not Own

- Large implementation work from Agents 1-4
- Secret rotation actions unless explicitly assigned
- Unrequested redesigns or refactors

Small obvious fixes are acceptable only when they are low risk and do not steal ownership from an implementation agent.

### Review Checklist

For Agent 1:

- Firecrawl key removed from frontend source.
- Frontend build output does not contain the old Firecrawl key pattern.
- Scraper functions require JWT or a private signed path.
- Server-side admin check exists before any service-role mutation.
- Profile role RLS is superadmin-only.
- Supabase security advisor warnings are reduced or documented.

For Agent 2:

- Rich text is sanitized before render.
- Strategy detail and modal render correctly.
- Pagination slices rows correctly.
- Admin batch fetch works in table and sheet views.
- Livestream external link uses `noopener,noreferrer`.
- No broken placeholder image route remains.

For Agent 3:

- `npm audit --omit=dev` improved.
- `npm run lint` status improved or passes.
- `npx tsc --noEmit` passes.
- `npm run build` passes.
- No dependency upgrade caused runtime crashes.

For Agent 4:

- Sitemap and robots use `https://hyperliquid.solidmetrics.co`.
- Admin URLs are not indexed unless explicitly approved.
- README and rebuild docs reflect the new domain plan.
- Duplicate and malformed URLs are cleaned or documented.
- Data changes are reversible or recorded.

### Full Regression Commands

Run after all fixes are merged:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm audit --omit=dev
npx supabase migration list --linked
npx supabase db advisors --linked --type security
npx supabase db advisors --linked --type performance
```

Run production smoke checks after deploy:

```bash
curl -I -L https://hyperliquid.solidmetrics.co/
curl -I -L https://hyperliquid.solidmetrics.co/admin/login
curl -I -L https://hyperliquid.solidmetrics.co/sitemap.xml
curl -s https://hyperliquid.solidmetrics.co/robots.txt
```

Browser smoke checks:

- Public home page
- Public strategy detail page
- Admin login
- Admin database list
- Admin edit asset flow
- Livestream page
- Mobile-width public listing

### Handoff Output

The review agent should produce a final post-fix report with:

- Fixed and verified items
- Failed checks
- Regressions found
- Items sent back to each implementation agent
- Remaining accepted risks
- Final deploy recommendation: `GO`, `GO WITH RISKS`, or `NO GO`

## Parallel Execution Order

### Round 1

Run in parallel:

- Agent 1: Security + Supabase
- Agent 2: Frontend App Fixes
- Agent 3: Dependencies + Build Health
- Agent 4: Data + SEO + Docs

Agent 5 waits for each patch and reviews section by section.

### Round 2

Agent 5 sends failures back to the relevant owner.

Implementation agents fix only their returned issues.

### Round 3

Agent 5 runs full regression.

If clean, deploy.

If not clean, classify each issue:

- blocker before deploy
- acceptable risk
- follow-up task

## Conflict Management

Likely conflict zones:

- `package.json` and `package-lock.json`: Agent 3 owns these.
- `src/components/AdminDataTable.tsx`: Agent 1 and Agent 2 may both touch scraper UI. Agent 2 owns UI, Agent 1 owns API/security contract.
- `src/utils/firecrawl.ts`: Agent 1 owns removal/migration.
- `DEFISTRATS_AUDIT_REPORT_2026-05-22.md`: Agent 5 owns final update, Agent 4 may update docs references only.
- `public/sitemap.xml`: Agent 4 owns.

Rule:

- If two agents need the same file, agree on ownership first. One agent edits; the other provides requirements.

## Completion Definition

The overall fix project is complete when:

- No exposed Firecrawl key remains in frontend source or built assets.
- Scraper mutations are protected by auth/admin checks.
- Rich text rendering is sanitized.
- Admin role RLS matches the intended privilege model.
- Public listing pagination works.
- Admin database batch fetch works in all intended views.
- SEO files use the new production domain.
- Critical/high dependency risks are fixed or explicitly documented.
- `npx tsc --noEmit` passes.
- `npm run build` passes.
- `npm run lint` either passes or has documented non-blocking exceptions.
- Agent 5 issues a final `GO` or `GO WITH RISKS` recommendation.

