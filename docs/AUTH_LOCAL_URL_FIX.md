# Auth local URL & settings migration fix

## Local URL

Use `http://localhost:3000`, not `http://0.0.0.0:3000`.
The app now redirects `0.0.0.0` to `localhost` when `NEXT_PUBLIC_SITE_URL` is not configured.

Recommended `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production, set it to the real public URL, e.g. `https://toko.example.com`.

In Supabase Auth URL Configuration, allow the corresponding callback URL(s), especially:

- `http://localhost:3000/auth/callback`
- production: `https://your-domain.com/auth/callback`

## Store settings/theme

Run migrations in order. For the latest release, make sure these exist in the database:

- `004_reliability_and_branding.sql`
- `005_store_theme.sql`

Without `005_store_theme.sql`, the theme field does not exist and saving the settings form will fail.

## Email signup

For the simplest customer flow, disable `Confirm email` in Supabase Auth → Providers → Email. Then new email/password registrations can log in without waiting for a confirmation email.
