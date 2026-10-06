# Deployment Kedai Karuhun — v10

## 1. Database

Jalankan migration `001` sampai `009` secara berurutan di Supabase SQL Editor.

Migration v10 adalah:

`supabase/migrations/009_phone_login_no_sms.sql`

## 2. Supabase Auth

Konfigurasi yang direkomendasikan untuk login tanpa SMS:

- Allow new users to sign up: ON
- Email provider: ON
- Confirm email: OFF
- Phone provider: OFF

Jangan isi Twilio Account SID, Auth Token, atau Message Service SID hanya untuk kebutuhan login password.

## 3. Migrasi akun lama

Admin lama:

```bash
npm run admin:phone -- email-lama@example.com 081234567890 "PASSWORD_BARU_KAMU" "Nama Admin"
```

Semua customer lama yang dibuat via Phone provider:

```bash
npm run auth:migrate-phone
```

Admin baru:

```bash
npm run admin:create -- 081234567890 "PASSWORD_BARU_KAMU" "Nama Admin"
```

## 4. Vercel

Set environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://domain-final-kamu.com
NEXT_PUBLIC_SITE_URL=https://domain-final-kamu.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@domain-final-kamu.com
```

`SUPABASE_SERVICE_ROLE_KEY` harus server-only dan tidak boleh memakai prefix `NEXT_PUBLIC_`.

## 5. Supabase Auth URL

Set Site URL ke domain production dan tambahkan:

`https://domain-final-kamu.com/auth/callback`

Aplikasi production tidak boleh menggunakan `0.0.0.0` sebagai URL publik.

## 6. Branding & PWA

Setelah login admin, isi logo toko, favicon/ikon aplikasi, dan warna tema. Manifest PWA serta favicon browser mengambil setting tersebut.

## 7. Web Push

Generate VAPID jika belum ada:

```bash
npm run generate:vapid
```

Public key boleh berada di `NEXT_PUBLIC_VAPID_PUBLIC_KEY`; private key harus server-only.

## 8. QA sebelum transaksi nyata

Test login customer, login admin, pendaftaran, perubahan nomor HP, order, upload bukti pembayaran, approval, status pesanan, broadcast notification, perubahan theme, logo/favicon, PWA install, kategori foto + ikon, dan alur logout/login ulang.
