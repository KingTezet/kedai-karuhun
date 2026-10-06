# Kedai Karuhun — Admin Order Actions

Perubahan pembayaran dan status pesanan menggunakan fungsi database atomik:

- `admin_set_payment_status`
- `admin_set_order_status`

Jalankan migration terbaru setelah migration yang sudah ada:

`supabase/migrations/004_reliability_and_branding.sql`

Fungsi melakukan validasi actor, lock order, update status, pembukuan, stok, audit event, dan notifikasi customer dalam satu operasi database.

Jika migration belum dijalankan, API akan mengembalikan pesan agar migration terbaru dijalankan; UI tidak lagi menyamarkan semua error menjadi satu pesan umum.
