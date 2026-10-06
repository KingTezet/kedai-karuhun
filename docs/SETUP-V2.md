# Kedai Karuhun — Setup produksi

## 1. Database (wajib, sekali)
Supabase → SQL Editor → jalankan migration **berurutan**:

1. `supabase/migrations/001_initial.sql`
2. `supabase/migrations/002_hardening.sql`
3. `supabase/migrations/003_production.sql`
4. `supabase/migrations/004_reliability_and_branding.sql`
5. `supabase/migrations/005_store_theme.sql`
6. `supabase/migrations/006_branding_category_icons.sql`
7. `supabase/seed.sql` bila ingin data contoh.

Migration 005 menambahkan warna tema. Migration 006 menambahkan favicon/ikon aplikasi dan ikon kategori custom.

## 2. Login admin pertama
Login admin memakai halaman yang sama dengan pelanggan: `/login`.

Password berada di **Supabase Auth**, bukan di `profiles`. Untuk membuat atau mengubah password admin pertama dengan aman dari komputer lokal:

```bash
npm run admin:create -- mochsugihnugraha@gmail.com "PASSWORD_BARU_KAMU" "Moch. Sugih Nugraha"
```

Script otomatis membuat user jika belum ada, atau memperbarui user yang sudah ada; user juga ditandai sudah confirmed dan profile diberi role `admin`.

## 3. Auth URL
Local:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Buka aplikasi melalui `http://localhost:3000`, bukan `http://0.0.0.0:3000`.

Production di Vercel:

```env
NEXT_PUBLIC_SITE_URL=https://domain-final-kamu.com
```

Di Supabase → Authentication → URL Configuration, isi Site URL dengan domain production dan tambahkan:

`https://domain-final-kamu.com/auth/callback`

Jika mode customer tidak ingin menunggu verifikasi email, Supabase → Authentication → Providers → Email → matikan `Confirm email`.

## 4. Branding
Admin → Pengaturan:

- Logo toko
- Nama toko
- Warna utama HEX
- Favicon / ikon aplikasi
- WhatsApp, QRIS, rekening, jam buka, dan area pengantaran

Saat logo toko diupload, favicon otomatis diisi dengan URL logo tersebut jika favicon khusus belum ada. Favicon khusus dapat diganti kapan saja.

## 5. Kategori
Admin → Kategori → Tambah/Ubah:

- Upload foto kategori
- Pilih ikon custom dari daftar ikon
- Pilih `Otomatis` untuk kembali ke ikon berdasarkan nama kategori

Jika foto kategori ada, foto menjadi tampilan utama. Hapus foto untuk kembali ke ikon.

## 6. Env
Salin `.env.example` menjadi `.env.local`. `SUPABASE_SERVICE_ROLE_KEY` hanya untuk server/local administration; jangan pernah diberi prefix `NEXT_PUBLIC_`.

## 7. Jalankan

```bash
npm install
npm run lint
npm run typecheck
npm run build
npm run dev
```
