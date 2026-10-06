# Setup Kedai Karuhun

## 1. Requirements
- Node.js 20+
- npm 10+
- Supabase project
- Vercel account for production

## 2. Env
Copy `.env.example` to `.env.local`.

Required:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
ADMIN_EMAILS (optional fallback; role in profiles is authoritative)

Optional Web Push:
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT

## 3. Supabase
Run `supabase/migrations/001_initial.sql`.
Then run `supabase/seed.sql`.

Create your first auth user through `/login`, then set that user's `profiles.role` to `admin` in Supabase SQL Editor.

Example:
update public.profiles set role='admin' where email='owner@example.com';

## 4. Storage
The migration creates:
- product-images (public read)
- store-assets (public read)
- payment-proofs (private)

## 5. Local
npm install
npm run typecheck
npm run lint
npm run dev

Open http://localhost:3000

## 6. Official references
Supabase SSR with Next.js: https://supabase.com/docs/guides/auth/server-side
Supabase Next.js quickstart: https://supabase.com/docs/guides/auth/quickstarts/nextjs
Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
Supabase Storage: https://supabase.com/docs/guides/storage

## 7. Web Push notification
If you want order notifications on admin devices, configure VAPID:

`npm run generate:vapid`

Copy the generated values into `.env.local`. Then open an admin page and click `Aktifkan` on the notification banner. The service worker will receive order notifications. Without VAPID, the in-app notification center still works.
