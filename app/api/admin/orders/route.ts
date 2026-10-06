import { fail, guard, ok, parseBody, dbError } from '@/lib/api'
import { STAFF } from '@/lib/permissions'
import { orderPatchSchema } from '@/lib/validation'
import { notifyUsers } from '@/lib/push'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Semua perubahan pesanan dijalankan melalui fungsi database server-side agar
 * pembayaran, status, stok, pembukuan, event, dan notifikasi tetap konsisten.
 */
export async function PATCH(req: Request) {
  const g = await guard(STAFF)
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, orderPatchSchema)
  if (error) return error
  if (!data.status && !data.payment_status) return fail('Tidak ada perubahan.')

  if (data.payment_status) {
    const { error: e } = await g.admin.rpc('admin_set_payment_status', {
      p_order_id: data.id,
      p_status: data.payment_status,
      p_note: data.note ?? null,
      p_actor_id: g.profile.id,
    })
    if (e) return fail(dbError(e.message, /function .*admin_set_payment_status/i.test(e.message) ? 'Sistem pembayaran belum diperbarui. Jalankan migration terbaru di Supabase.' : 'Gagal memperbarui pembayaran.'), 500)
  }

  if (data.status) {
    const { error: e } = await g.admin.rpc('admin_set_order_status', {
      p_order_id: data.id,
      p_status: data.status,
      p_note: data.note ?? null,
      p_actor_id: g.profile.id,
    })
    if (e) return fail(dbError(e.message, /function .*admin_set_order_status/i.test(e.message) ? 'Sistem pesanan belum diperbarui. Jalankan migration terbaru di Supabase.' : 'Gagal memperbarui status pesanan.'), 500)
  }

  const { data: order } = await createAdminClient()
    .from('orders')
    .select('buyer_id,order_number')
    .eq('id', data.id)
    .maybeSingle()

  if (order?.buyer_id) {
    if (data.payment_status) {
      await notifyUsers(
        [order.buyer_id],
        data.payment_status === 'verified' ? 'Pembayaran diterima' : 'Bukti pembayaran ditolak',
        data.payment_status === 'verified'
          ? `Pembayaran ${order.order_number} sudah kami terima.`
          : `Bukti pembayaran ${order.order_number} ditolak. Silakan cek pesanan dan unggah ulang.`,
        `/orders/${data.id}`,
        'payment_update',
      )
    }
    if (data.status) {
      const text: Record<string, string> = {
        confirmed: 'Pesananmu sudah dikonfirmasi toko.',
        processing: 'Pesananmu sedang disiapkan.',
        ready: 'Pesananmu siap diantar.',
        delivering: 'Pesananmu sedang diantar.',
        completed: 'Pesanan selesai. Terima kasih!',
        cancelled: `Pesanan dibatalkan${data.note ? `: ${data.note}` : '.'}`,
      }
      await notifyUsers([order.buyer_id], `Pesanan ${order.order_number} diperbarui`, text[data.status] || 'Status pesanan diperbarui.', `/orders/${data.id}`, 'order_update')
    }
  }

  return ok()
}
