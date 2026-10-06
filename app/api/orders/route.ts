import { fail, guard, ok, parseBody, dbError } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'
import { orderSchema } from '@/lib/validation'

export async function POST(req: Request) {
  const g = await guard('user')
  if ('error' in g) return g.error
  const { profile, admin } = g

  const { data: body, error } = await parseBody(req, orderSchema)
  if (error) return error

  // 1. alamat: pakai yang tersimpan (milik user) atau alamat baru
  const sb = await createClient()
  let address: { recipient_name: string; phone: string; address_line: string; notes?: string | null; label?: string }
  if (body.addressId) {
    const { data: a } = await sb.from('customer_addresses').select('*').eq('id', body.addressId).eq('user_id', profile.id).maybeSingle()
    if (!a) return fail('Alamat tidak ditemukan.', 404)
    address = { recipient_name: a.recipient_name, phone: a.phone, address_line: a.address_line, notes: a.notes, label: a.label }
  } else {
    const a = body.address!
    address = { recipient_name: a.recipient_name, phone: a.phone, address_line: a.address_line, notes: a.notes ?? null, label: a.label }
  }

  // 2. buat order di database (atomik: validasi stok, hitung total, catat movement)
  const { data: orderId, error: rpcErr } = await sb.rpc('create_order', {
    p_buyer_id: profile.id,
    p_items: body.items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
    p_zone_id: body.deliveryZoneId,
    p_payment_method: body.paymentMethod,
    p_address: address,
    p_note: body.note ?? null,
  })
  if (rpcErr || !orderId) return fail(dbError(rpcErr?.message ?? '', 'Pesanan gagal dibuat. Coba lagi.'), 400)

  // 3. efek samping (gagal tidak membatalkan order)
  try {
    await admin.from('profiles').update({ full_name: profile.full_name || address.recipient_name, phone: profile.phone || address.phone }).eq('id', profile.id)
    if (!body.addressId && body.saveAddress && body.address) {
      const { count } = await admin.from('customer_addresses').select('id', { count: 'exact', head: true }).eq('user_id', profile.id)
      await admin.from('customer_addresses').insert({
        user_id: profile.id,
        label: body.address.label,
        recipient_name: body.address.recipient_name,
        phone: body.address.phone,
        address_line: body.address.address_line,
        notes: body.address.notes ?? null,
        zone_id: body.deliveryZoneId,
        is_default: (count ?? 0) === 0,
      })
    }
  } catch {}

  const { data: o } = await admin.from('orders').select('order_number,total_idr').eq('id', orderId).maybeSingle()
  try {
    const { notifyStaff } = await import('@/lib/push')
    await notifyStaff('Pesanan baru', `${o?.order_number ?? ''} · masuk dari ${address.recipient_name}`, `/admin/orders/${orderId}`, 'new_order')
  } catch {}

  return ok({ orderId, orderNumber: o?.order_number, total: o?.total_idr })
}
