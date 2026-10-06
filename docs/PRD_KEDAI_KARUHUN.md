# PRD — Kedai Karuhun Commerce PWA

## 1. Ringkasan
Kedai Karuhun adalah toko kebutuhan harian yang membutuhkan e-commerce milik sendiri, diutamakan mobile/PWA, mudah dipakai segala umur, dan sederhana bagi pengguna yang tidak terlalu akrab dengan teknologi.

Produk fase awal: sembako, sayur, buah, telur/protein, minuman, kebutuhan rumah.

Model order: pelanggan memilih produk → keranjang → checkout → pilih area pengantaran → pilih QRIS / transfer / COD → pesanan masuk admin → admin verifikasi dan memproses → pesanan diantar oleh Kedai Karuhun.

## 2. Prinsip Produk
1. Mobile-first, karena mayoritas sesi belanja diperkirakan berasal dari HP.
2. Bahasa Indonesia sederhana.
3. Satu layar, satu tujuan. Jangan menambah langkah yang tidak perlu.
4. Tombol besar, kontras tinggi, feedback jelas.
5. Customer dapat browsing tanpa login. Login diminta saat checkout/order atau ketika membuka akun/pesanan.
6. Session dipertahankan sehingga user tidak diminta login setiap pindah halaman.
7. Admin harus cepat melihat order baru.
8. Data pesanan, stok, dan keuangan harus tercatat dan dapat diaudit.
9. Pembayaran aman: QRIS dan transfer melalui instruksi resmi toko + bukti pembayaran; COD tanpa bukti.
10. Tidak mengunci arsitektur ke jumlah kategori/produk tertentu.

## 3. Target Pengguna
- Ibu/bapak rumah tangga.
- Pelanggan umum segala umur.
- Pelanggan yang tidak terbiasa memakai e-commerce rumit.
- Admin utama: pemilik/pengelola Kedai Karuhun.

## 4. Public Experience
- Beranda
- Kategori
- Daftar produk
- Detail produk
- Pencarian/filter
- Keranjang
- Checkout
- Riwayat pesanan
- Akun
- Bantuan

Navigasi mobile: Beranda, Kategori, Keranjang, Pesanan, Akun.

## 5. Checkout
Checkout dibuat sesingkat mungkin:
1. Data penerima
2. Area pengantaran
3. Pembayaran
4. Catatan
5. Buat pesanan

Nama, nomor HP, dan alamat dapat disimpan sebagai alamat default.

## 6. Pembayaran
### QRIS
Tampilkan QRIS resmi toko, nominal order, dan instruksi singkat. Customer upload bukti pembayaran. Admin verifikasi.

### Transfer Bank
Tampilkan bank, nama rekening, nomor rekening, nominal. Customer upload bukti. Admin verifikasi.

### COD
Customer cukup memilih COD. Status pembayaran otomatis `cod`, lalu pelanggan membayar saat barang datang.

Arsitektur payment adapter harus memungkinkan integrasi payment gateway/QRIS dinamis di masa depan tanpa mengubah order model.

## 7. Admin
Admin harus memiliki:
- Ringkasan/dashboard
- Pesanan
- Produk
- Stok
- Keuangan
- Pengguna
- Kategori
- Pengaturan toko
- Notifikasi

### Pesanan
- order baru
- status pesanan
- status pembayaran
- detail item
- alamat
- kontak customer
- bukti pembayaran
- verifikasi pembayaran
- status pengantaran
- buka WhatsApp customer dengan pesan siap kirim

Status order:
new → confirmed → processing → ready → delivering → completed / cancelled.

Status payment:
pending → proof_uploaded → verified / failed; COD = cod.

### Produk
- tambah/edit/nonaktifkan
- nama
- SKU
- kategori
- harga
- satuan
- stok
- threshold stok menipis
- foto produk
- deskripsi
- unggulan

### Stok
- stok saat ini
- low stock
- histori pergerakan stok
- sumber penjualan/order
- adjustment manual

### Keuangan
- revenue order
- expense manual
- net operating cashflow
- transaksi per tanggal/kategori

### Pengguna
- customer/staff/manager/admin
- blokir/aktifkan
- profil

### Kategori
CRUD kategori.

### Pengaturan
- logo
- nama toko
- WhatsApp
- QRIS image
- rekening
- alamat
- jam buka
- pesan toko
- area pengantaran dan ongkir

## 8. Notification System
Prioritas:
1. In-app notification di admin.
2. Web Push/PWA notification ke browser/device admin jika VAPID dikonfigurasi.
3. WhatsApp otomatis merupakan integrasi opsional via provider resmi di fase berikutnya. Jangan menggunakan metode WhatsApp scraping/unofficial API.

## 9. Security
- Supabase Auth cookie-based SSR.
- RLS aktif di seluruh tabel public yang terekspos.
- Service role hanya server-side.
- Admin authorization server-side.
- Validasi semua input.
- Idempotency untuk integrasi pembayaran/webhook masa depan.
- Bukti pembayaran private.
- Product images public read, staff write.
- Hindari menyimpan secret/API key di client.

## 10. Tech Stack
- Next.js App Router
- React + TypeScript
- Tailwind CSS dengan design system custom
- Supabase Auth + PostgreSQL + Storage
- Vercel
- PWA manifest + Service Worker
- Web Push via `web-push` + VAPID
- Zod untuk validation
- Lucide icons

Supabase menyarankan `@supabase/ssr` untuk Next.js cookie-based sessions, dan RLS sebaiknya diaktifkan pada tabel yang terekspos. Lihat `docs/SETUP.md` untuk link dokumentasi resmi.

## 11. Performance
- Server Components untuk data read.
- Parallel data fetching.
- Link prefetch.
- Loading skeletons.
- Optimistic cart interaction via localStorage.
- Hindari request berulang.
- Gunakan image sizing yang benar.
- Cache data katalog publik jika nanti traffic meningkat.

## 12. PWA
- Installable via manifest.
- Standalone display.
- Theme green.
- Portrait mobile.
- Service worker.
- Install prompt jika browser mendukung.
- Safe area untuk device dengan gesture/navigation bar.

## 13. Data Model
profiles
categories
products
delivery_zones
customer_addresses
orders
order_items
inventory_movements
financial_transactions
push_subscriptions
notifications
store_settings

## 14. Milestone
MVP production:
- customer shopping
- checkout
- QRIS/transfer/COD
- admin order processing
- stock
- finance
- users
- categories
- PWA
- notifications
- storage upload

## 15. Non-goals awal
- marketplace multi-vendor
- loyalty point kompleks
- live driver tracking
- AI chatbot
- payment gateway multi-provider otomatis tanpa credentials
- WhatsApp bot unofficial
