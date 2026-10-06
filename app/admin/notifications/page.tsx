import { requireRole } from '@/lib/auth'
import { ADMIN } from '@/lib/permissions'
import { BroadcastForm } from '@/components/admin/broadcast-form'

export default async function AdminNotificationsPage() {
  await requireRole(ADMIN)
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold">Notifikasi pelanggan</h2>
        <p className="mt-1 max-w-2xl text-[15px] text-ink-muted">Kirim pengumuman, promo, produk baru, atau informasi toko ke semua pelanggan yang punya akun. Pelanggan yang mengaktifkan push akan menerima notifikasi di perangkatnya.</p>
      </div>
      <BroadcastForm />
    </div>
  )
}
