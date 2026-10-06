# Kedai Karuhun v7 — Web Push Notifications

## Fitur

### Admin
- Aktifkan notifikasi perangkat dari ikon lonceng di panel admin.
- Pesanan baru dikirim sebagai push ke semua perangkat staff/manager/admin yang sudah subscribe.
- Bukti pembayaran baru juga dikirim sebagai push.
- Menu **Notifikasi** hanya untuk admin, berisi broadcast ke semua pelanggan.

### Pelanggan
- Di **Akun → Notifikasi**, pelanggan dapat mengaktifkan push.
- Broadcast dari admin masuk ke inbox notifikasi dan push pada perangkat yang sudah subscribe.
- Update status order dan pembayaran juga dikirim sebagai push.
- Pelanggan bisa mematikan push kapan saja.

## Environment Vercel

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@kedaikaruhun.my.id
```

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` boleh dibaca browser. `VAPID_PRIVATE_KEY` wajib hanya server-side dan jangan pernah masuk ke Git.

## Generate VAPID

```bash
npm run generate:vapid
```

Simpan hasilnya ke environment Vercel. Gunakan pasangan key yang sama untuk semua deployment.

## Supabase

Jalankan migration:

```text
007_push_broadcasts.sql
```

setelah `001` sampai `006`.

## iPhone/iPad

User harus menambahkan web app ke Home Screen dan membuka app dari ikon tersebut sebelum mengaktifkan notification. Permission notification juga perlu diberikan setelah tombol subscribe ditekan.

## Catatan

- Broadcast v7 saat ini targetnya **semua pelanggan yang akun aktif**.
- Push hanya benar-benar masuk ke perangkat yang sudah mengaktifkan push.
- Pelanggan tanpa push tetap menerima broadcast sebagai notifikasi inbox di halaman Akun.
