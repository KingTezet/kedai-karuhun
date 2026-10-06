# Kedai Karuhun — Production Checklist v2

## Authentication

- [ ] Login email + password berhasil
- [ ] Daftar customer berhasil
- [ ] Login tidak mengirim email setiap kali
- [ ] Session tetap tersimpan
- [ ] Lupa password hanya mengirim email saat diminta
- [ ] Admin dapat membuat customer/staff/manager/admin sesuai role

## Orders

- [ ] Admin menerima pesanan baru
- [ ] Approve pembayaran berhasil
- [ ] Reject pembayaran wajib alasan
- [ ] Konfirmasi order berhasil
- [ ] Status order mengikuti alur
- [ ] Cancel mengembalikan stok
- [ ] Event audit tercatat
- [ ] Customer mendapat notifikasi

## UX

- [ ] Input tidak kehilangan fokus saat mengetik
- [ ] Semua aksi destructive memiliki konfirmasi
- [ ] Toast sukses/error tampil
- [ ] Loading state tampil
- [ ] Mobile bottom navigation tampil
- [ ] Foto kategori dapat diatur admin
- [ ] Nama toko terpisah dari file logo

## Supabase

- [ ] Migration 001–004 sudah dijalankan
- [ ] RLS aktif
- [ ] Service role hanya server-side
- [ ] Redirect URLs production benar
- [ ] Custom SMTP untuk production
