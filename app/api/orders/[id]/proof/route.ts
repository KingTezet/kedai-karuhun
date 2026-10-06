import { randomUUID } from 'crypto'
import { fail, guard, ok } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'
import { notifyStaff } from '@/lib/push'

const MIME: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }
const MAX = 5 * 1024 * 1024

/** Upload bukti bayar. Hanya pemilik order. File disimpan private. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const g = await guard('user')
  if ('error' in g) return g.error
  const { profile, admin } = g

  // RLS: hanya order milik user ini yang terbaca
  const sb = await createClient()
  const { data: o } = await sb.from('orders').select('id,order_number,payment_method,payment_status,status,payment_proof_path').eq('id', id).eq('buyer_id', profile.id).maybeSingle()
  if (!o) return fail('Pesanan tidak ditemukan.', 404)
  if (o.payment_method === 'cod') return fail('Pesanan COD tidak perlu bukti pembayaran.')
  if (o.status === 'cancelled') return fail('Pesanan ini sudah dibatalkan.')
  if (o.payment_status === 'verified') return fail('Pembayaran sudah diverifikasi.')

  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    return fail('File tidak terbaca.')
  }
  const file = fd.get('file')
  if (!(file instanceof File) || file.size === 0) return fail('Pilih file bukti pembayaran.')
  if (file.size > MAX) return fail('Ukuran file maksimal 5 MB.')
  const ext = MIME[file.type]
  if (!ext) return fail('Format harus JPG, PNG, WEBP, atau PDF.')

  const buf = Buffer.from(await file.arrayBuffer())
  // cek magic bytes: jangan percaya Content-Type dari klien
  const head = buf.subarray(0, 12)
  const isJpg = head[0] === 0xff && head[1] === 0xd8
  const isPng = head[0] === 0x89 && head[1] === 0x50
  const isWebp = head.subarray(0, 4).toString() === 'RIFF' && head.subarray(8, 12).toString() === 'WEBP'
  const isPdf = head.subarray(0, 4).toString() === '%PDF'
  if (!(isJpg || isPng || isWebp || isPdf)) return fail('Isi file tidak valid.')

  const path = `${profile.id}/${id}/${randomUUID()}.${ext}`
  const up = await admin.storage.from('payment-proofs').upload(path, buf, { contentType: file.type, upsert: false })
  if (up.error) return fail('Upload gagal. Coba lagi.', 500)

  const { error: upErr } = await admin.from('orders').update({ payment_status: 'proof_uploaded', payment_proof_path: path, payment_note: null }).eq('id', id)
  if (upErr) return fail('Gagal menyimpan bukti pembayaran.', 500)
  if (o.payment_proof_path) await admin.storage.from('payment-proofs').remove([o.payment_proof_path])

  await admin.from('order_events').insert({ order_id: id, actor_id: profile.id, type: 'proof_uploaded', note: 'Pelanggan mengunggah bukti pembayaran' })
  await admin.from('notifications').insert({
    audience_role: 'staff',
    type: 'payment_proof',
    title: 'Bukti pembayaran baru',
    body: `Pesanan ${o.order_number} menunggu verifikasi.`,
    href: `/admin/orders/${id}`,
  })
  await notifyStaff('Bukti pembayaran baru', `${o.order_number} menunggu verifikasi`, `/admin/orders/${id}`)
  return ok()
}
