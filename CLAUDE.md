# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on port 8080
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview built application

## Architecture Overview

This is a React-based DeFi staking assets platform with admin functionality, built with:

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui components + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **State Management**: TanStack Query for server state
- **Routing**: React Router DOM

### Database Schema
Three main tables in Supabase:
- `staking_assets` - Core staking opportunities with APY, TVL, risk levels, protocols
- `profiles` - User profiles with admin/superadmin flags
- `admin_requests` - Requests for admin access

### Key Architecture Patterns

**Authentication & Authorization**:
- Supabase Auth handles user authentication
- `AdminProtectedRoute` component wraps admin routes
- Role-based access with `is_admin` and `is_superadmin` flags in profiles table
- Row Level Security (RLS) policies control database access

**Data Flow**:
- TanStack Query manages server state and caching (5 min stale time, 10 min garbage collection)
- Supabase client (`@/integrations/supabase/client`) handles all database operations
- Auto-generated TypeScript types from Supabase schema in `@/integrations/supabase/types`
- Query invalidation after admin updates ensures real-time data consistency across all pages

**Component Structure**:
- Pages in `/src/pages/` handle routing and data fetching
- Reusable components in `/src/components/`
- shadcn/ui components in `/src/components/ui/`
- Path alias `@/` points to `/src/`

**UI/UX Patterns**:
- Dark theme with green accent color (`#75E0A7`)
- Consistent spacing using Tailwind's space utilities
- Form sections wrapped in `FormSection` component with titles and descriptions
- Grid-based responsive layouts (1 column mobile, 2-3 columns desktop)
- Focus states with green ring for accessibility
- Loading states with spinner animations
- Error messages in red with clear, actionable text
- Placeholder text with real-world examples
- Visual hierarchy through typography scale and color contrast

### Admin System
- Separate admin login flow (`/admin/login`)
- Protected admin routes: `/admin/add`, `/admin/database`, `/admin/user`
- Admin can manage staking assets, view database, and handle user requests
- SuperAdmin has additional privileges

**Admin Form Components** (`/admin/add`):
- `ProtocolInfoForm` - Protocol name and blockchain network input
- `StrategyInfoForm` - Strategy details, APY/TVL, risk levels, asset management
- `CTAInfoForm` - External links (video guides, referral links, protocol website)
- `APYTVLFetcher` - Automated data scraping for existing assets (edit mode only)
- Progressive form layout with visual step indicators
- Real-time validation with helpful error messages
- File upload integration with Supabase Storage for asset logos

### Key Features
- Public staking assets listing with filtering and sorting
- Featured assets display on homepage
- Risk level categorization (low/medium/high) with visual indicators
- Asset metadata includes logos, descriptions, audit information
- Rich text editor for detailed strategy descriptions
- Admin interface for CRUD operations on assets
- User request system for admin access
- Responsive design optimized for desktop and mobile
- Progressive form experience with loading states and validation feedback

## Supabase Integration

Database types are auto-generated in `src/integrations/supabase/types.ts`. When schema changes, regenerate types using Supabase CLI.

The app uses Supabase's built-in authentication and RLS policies to secure data access. Admin routes check both authentication status and user role from the profiles table.

### Storage Configuration
- **Asset Logos Bucket**: `asset-logos` - stores uploaded asset images
- Bucket is public with 5MB file size limit
- Supports: JPEG, PNG, GIF, WebP, SVG
- Auto-created on first upload if missing
- RLS policies allow authenticated uploads, public reads

### Running Database Migrations
- New migrations: `npx supabase migration new <name>`
- Apply migrations: `npx supabase db push` (requires project link)
- For remote projects, apply migrations manually via Supabase dashboard

## Known Issues & Solutions

### Strategy Description Updates Not Reflecting (Fixed)
**Issue**: When admins update strategy descriptions in `/admin/add?edit`, changes don't immediately appear on the main page.

**Root Cause**: TanStack Query caches data for 5 minutes. After database updates, the cache wasn't being invalidated.

**Solution**: Added query invalidation in `AdminAdd.tsx` after successful database updates:
```typescript
// Invalidate queries to refresh the data on all pages
await queryClient.invalidateQueries({ queryKey: ['staking-assets'] });
await queryClient.invalidateQueries({ queryKey: ['featured-assets'] });
```

**Files Modified**: 
- `src/pages/AdminAdd.tsx` - Added `useQueryClient` import and query invalidation after updates