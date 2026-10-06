# Kedai Karuhun Commerce PWA

Mobile-first commerce application for Kedai Karuhun.

## Stack
- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Supabase Auth/PostgreSQL/Storage
- Vercel
- PWA + Web Push

## Start
cp .env.example .env.local
npm install
npm run dev

See `docs/SETUP.md` and `docs/PRD_KEDAI_KARUHUN.md`.

The logo placeholder lives under `public/branding/` when provided. Replace it with the real Kedai Karuhun logo without changing the application architecture.

## Auth v8 — Nomor HP + Password

Login dan pendaftaran pelanggan sekarang menggunakan **nomor HP + password**. Email tidak diperlukan untuk membuat akun baru atau login harian. Format yang diterima di UI adalah nomor Indonesia seperti `0812 3456 7890`, lalu sistem menyimpannya ke Supabase Auth dalam format internasional.

Di Supabase: **Authentication → Providers → Phone** harus aktif. Untuk alur paling sederhana tanpa SMS saat daftar, matikan **Confirm phone**. Supabase mendukung sign up dan sign in dengan phone + password secara resmi.

Admin juga membuat pengguna dengan nomor HP dari **Admin → Pengguna → Tambah pengguna**. Untuk memindahkan admin lama yang masih login dengan email ke nomor HP tanpa kehilangan akun/order, gunakan:

```bash
npm run admin:phone -- email-lama@example.com 081234567890 "PasswordBaruMinimal8" "Nama Admin"
```

Untuk membuat admin baru berbasis nomor HP:

```bash
npm run admin:create -- 081234567890 "PasswordMinimal8" "Nama Admin"
```

Lihat `docs/PHONE_AUTH_SETUP.md` untuk langkah setup Supabase.

## Web Push v7

Lihat `docs/PUSH_NOTIFICATIONS_V7.md`. Jalankan migration `007_push_broadcasts.sql` dan isi environment VAPID di Vercel.

## Theme toko

Admin dapat mengganti warna utama toko dari **Admin → Pengaturan → Tampilan toko**. Warna bisa dipilih lewat color picker, preset, atau input HEX seperti `#2563EB`.

Jalankan migration `supabase/migrations/005_store_theme.sql` setelah migration 001–004.

## Branding + Auth

Jalankan migration 004, 005, 006, 007, dan 008 setelah migration sebelumnya. Login dan pendaftaran baru menggunakan nomor HP + password.

Untuk migrasi admin lama dari email ke nomor HP tanpa kehilangan akun/order:

```bash
npm run admin:phone -- email-lama@example.com 081234567890 "PasswordBaruMinimal8" "Nama Admin"
```

## Web Push v7

Lihat `docs/PUSH_NOTIFICATIONS_V7.md`. Jalankan migration `007_push_broadcasts.sql` dan isi environment VAPID di Vercel.

## v10 — Login Nomor HP Tanpa SMS

UI login customer menggunakan nomor HP + password. Supabase Phone provider tidak dibutuhkan; aplikasi memakai alias email internal hanya sebagai identity key supaya tidak bergantung pada Twilio/SMS. Jalankan migration `009_phone_login_no_sms.sql`, matikan Phone provider, dan biarkan Email provider + Confirm email OFF.

## v10 Auth: Nomor HP tanpa SMS

Customer login/register tetap hanya menampilkan nomor HP + password. Di belakang layar Supabase Email + Password dipakai dengan alias email internal berbasis nomor HP (`@auth.kedaikaruhun.my.id`). Tidak ada email customer yang diminta/dikirim untuk login, dan Phone provider/Twilio tidak diperlukan.
