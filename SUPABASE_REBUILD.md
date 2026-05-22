# Supabase Rebuild Runbook

Use this when replacing the lost Supabase project with a fresh one.

## 1. Create The New Project

Create a new Supabase project from the dashboard and save:

- Project ref
- Project URL
- Publishable or anon key
- Service role key
- Database password

Do not put the service role key in frontend hosting environment variables.

## 2. Configure Local Env

Copy `.env.example` to `.env.local` and fill in:

```sh
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
```

Only add `SUPABASE_SERVICE_KEY` locally if you need to run scripts such as `scripts/setup-storage.js`.

## 3. Link And Push Schema

From this repo:

```sh
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push --dry-run
npx supabase db push
```

Supabase's current migration docs describe this flow as: log in, link the project, then run `supabase db push`.

## 4. Deploy Edge Functions

Deploy the functions used by the app:

```sh
npx supabase functions deploy scrape-data
npx supabase functions deploy scrape-apy-tvl
npx supabase functions deploy schedule-scrapers
npx supabase functions deploy create-admin-user
npx supabase functions deploy track-analytics
```

Then set secrets needed by those functions:

```sh
npx supabase secrets set FIRECRAWL_API_KEY=your-firecrawl-key
```

Supabase automatically provides `SUPABASE_URL` and service keys to Edge Functions in normal hosted projects.

## 5. Create First Admin

Create your user in Supabase Auth, then set the matching row in `public.profiles` as admin:

```sql
update public.profiles
set is_admin = true, is_superadmin = true
where email = 'your-email@example.com';
```

If no profile row exists, insert one using the auth user id from `auth.users`.

## 6. Hosting Env And Domain

In the frontend host, set:

```sh
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
```

Rebuild/redeploy the frontend at `https://hyperliquid.solidmetrics.co`.

`defistrats.xyz` is being allowed to expire. Do not add new DNS, sitemap, metadata, or documentation references that depend on `defistrats.xyz`.

After deploying, check that the frontend host has:

- The `hyperliquid.solidmetrics.co` production domain attached.
- `public/robots.txt` pointing to `https://hyperliquid.solidmetrics.co/sitemap.xml`.
- `public/sitemap.xml` containing only public URLs on `https://hyperliquid.solidmetrics.co`.

## 7. Smoke Test

Check:

- `/` loads without Supabase env errors
- `/admin/login` accepts your admin user
- `/admin/add` can create a draft and publish it
- `/admin/database` shows the new row
- The public table shows only published strategies
- Banner upload works through the `asset-logos` bucket
- `https://hyperliquid.solidmetrics.co/robots.txt` references the current sitemap
- `https://hyperliquid.solidmetrics.co/sitemap.xml` does not include admin URLs

## 8. Export And Backup

Before destructive rebuilds or content cleanup, export both schema and data:

```sh
npx supabase db dump --linked --file backups/defistrats_schema_YYYYMMDD.sql
npx supabase db dump --linked --data-only --use-copy --file backups/defistrats_data_YYYYMMDD.sql
```

For a smaller operator handoff, export the core content tables from SQL or the Supabase dashboard:

- `staking_assets`
- `apy_tvl_configs`
- `scraper_configs`
- `banners`
- `livestream_videos`

Store backups outside the deployed app bundle. Do not commit dumps if they contain user data, analytics data, private URLs, or credentials.
