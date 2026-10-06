# Kedai Karuhun — Branding & Foto Kategori

## Nama toko

Nama toko disimpan terpisah di `store_settings.store_name`.

## Logo

`logo_url` adalah file logo.

Field `logo_contains_store_name` menentukan apakah file logo sudah mengandung tulisan nama toko.

- `true`: tampilkan file logo apa adanya.
- `false`: tampilkan logo sebagai ikon + `store_name` sebagai teks terpisah.

## Kategori

Kategori memiliki `image_url`.

Admin dapat mengunggah foto kategori. Jika foto tersedia, foto digunakan. Jika kosong, sistem memakai ikon sederhana sebagai fallback.

## Theme warna toko

Migration `005_store_theme.sql` menambahkan `store_settings.theme_primary_hex`.

Di **Admin → Pengaturan → Tampilan toko**, admin dapat:

- memilih warna lewat color picker;
- memakai preset warna;
- mengetik HEX 6 digit;
- melihat preview sebelum menyimpan.

Warna akan menjadi dasar seluruh kelas `brand-*` di halaman toko tanpa perlu mengubah kode frontend.
