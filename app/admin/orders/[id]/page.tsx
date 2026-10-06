import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Phone, StickyNote } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { STAFF } from '@/lib/permissions'
import { getSettings } from '@/lib/store'
import { signedProofUrl } from '@/lib/proof'
import { formatDateTime, num, rupiah, waLink } from '@/lib/utils'
import { METHOD_LABEL, ORDER_LABEL, ORDER_TONE, PAYMENT_LABEL, PAYMENT_TONE } from '@/lib/status'
import { Badge, PageHeader } from '@/components/ui'
import { OrderActions } from '@/components/admin/order-actions'
import { OrderTimeline } from '@/components/order-timeline'
import { Panel } from '@/components/admin/ui'
import { AutoRefresh } from '@/components/auto-refresh'
import { TrackAdminView } from '@/components/admin/track-view'
import type { Order, OrderItem, OrderStatus } from '@/types'

export const metadata: Metadata = { title: 'Detail pesanan' }

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireRole(STAFF)
  const admin = createAdminClient()
  const { data } = await admin.from('orders').select('*').eq('id', id).maybeSingle()
  if (!data) notFound()
  const o = data as Order
  const [{ data: items }, { data: events }, { data: buyer }, settings, proofUrl] = await Promise.all([
    admin.from('order_items').select('*').eq('order_id', id).order('created_at'),
    admin.from('order_events').select('id,type,from_status,to_status,note,created_at,actor_id').eq('order_id', id).order('created_at', { ascending: false }),
    admin.from('profiles').select('email,phone,full_name').eq('id', o.buyer_id).maybeSingle(),
    getSettings(),
    signedProofUrl(o.payment_proof_path),
  ])
  const a = o.address_snapshot ?? {}
  const lines = (items ?? []) as OrderItem[]
  const msg = `Halo ${a.recipient_name ?? ''}, pesanan ${o.order_number} di ${settings?.store_name || 'Kedai Karuhun'} sudah ${ORDER_LABEL[o.status].toLowerCase()}. Total ${rupiah(o.total_idr)}. Terima kasih 🙏`
  const active = !['completed', 'cancelled'].includes(o.status)

  return (
    <div>
      <TrackAdminView id={o.id} />
      {active && <AutoRefresh seconds={20} />}
      <PageHeader
        title={o.order_number}
        subtitle={formatDateTime(o.created_at)}
        back={{ href: '/admin/orders', label: 'Semua pesanan' }}
        action={<Badge tone={ORDER_TONE[o.status]} className="px-3 py-1.5 text-sm">{ORDER_LABEL[o.status]}</Badge>}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-5">
          <Panel title="Barang pesanan">
            <ul className="divide-y divide-line">
              {lines.map((x) => (
                <li key={x.id} className="flex justify-between gap-3 py-3">
                  <div className="min-w-0"><p className="font-semibold">{x.product_name_snapshot}</p><p className="text-[14px] text-ink-muted">{num(x.quantity)} {x.unit_snapshot} × {rupiah(x.unit_price_idr)}</p></div>
                  <p className="shrink-0 font-bold">{rupiah(x.line_total_idr)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-1 space-y-1.5 border-t border-line pt-3 text-[15px]">
              <div className="flex justify-between"><dt className="text-ink-muted">Subtotal</dt><dd className="font-semibold">{rupiah(o.subtotal_idr)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Ongkir {a.zone_name ? `(${a.zone_name})` : ''}</dt><dd className="font-semibold">{rupiah(o.delivery_fee_idr)}</dd></div>
              <div className="flex items-baseline justify-between border-t border-line pt-2"><dt className="font-bold">Total</dt><dd className="text-2xl font-extrabold text-brand-700">{rupiah(o.total_idr)}</dd></div>
            </dl>
          </Panel>

          <Panel title="Pelanggan & alamat">
            <p className="text-lg font-bold">{a.recipient_name}</p>
            <p className="mt-1 flex items-center gap-2 text-[15px]"><Phone size={16} className="text-brand-600" /> {a.phone}</p>
            <p className="mt-1 flex items-start gap-2 text-[15px]"><MapPin size={16} className="mt-1 shrink-0 text-brand-600" /> <span>{a.address_line}{a.notes ? ` (${a.notes})` : ''}{a.zone_name ? ` — ${a.zone_name}` : ''}</span></p>
            {o.note && <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[14px] text-amber-900"><StickyNote size={16} className="mt-0.5 shrink-0" /> <span><b>Catatan pelanggan:</b> {o.note}</span></p>}
            {(buyer?.phone || buyer?.email) && <p className="mt-2 text-xs text-ink-muted">Akun: {buyer.phone || buyer.email}</p>}
          </Panel>

          <Panel title="Riwayat">
            {(events ?? []).length === 0 ? <p className="text-ink-muted">Belum ada riwayat.</p> : (
              <ul className="space-y-3">
                {(events ?? []).map((e) => (
                  <li key={e.id} className="flex gap-3 text-[14px]">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden />
                    <span className="min-w-0">
                      <b>{e.type === 'status' ? `Status: ${ORDER_LABEL[e.to_status as OrderStatus] ?? e.to_status}` : e.type === 'created' ? 'Pesanan dibuat' : e.type === 'proof_uploaded' ? 'Bukti bayar dikirim' : e.type === 'payment_verified' ? 'Pembayaran diterima' : e.type === 'payment_failed' ? 'Pembayaran ditolak' : e.type}</b>
                      {e.note && <span className="text-ink-muted"> — {e.note}</span>}
                      <span className="block text-xs text-ink-faint">{formatDateTime(e.created_at)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-5 lg:sticky lg:top-24">
          <Panel title="Tindakan">
            <OrderActions id={o.id} status={o.status} paymentStatus={o.payment_status} paymentMethod={o.payment_method} waUrl={a.phone ? waLink(a.phone, msg) : null} />
          </Panel>

          <Panel title="Pembayaran">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{METHOD_LABEL[o.payment_method]}</p>
              {o.status !== 'cancelled' && <Badge tone={PAYMENT_TONE[o.payment_status]}>{PAYMENT_LABEL[o.payment_status]}</Badge>}
            </div>
            {o.payment_note && <p className="mt-2 rounded-xl bg-red-50 p-3 text-[14px] text-red-900">Catatan: {o.payment_note}</p>}
            {o.verified_at && <p className="mt-2 text-[13px] text-ink-muted">Diverifikasi {formatDateTime(o.verified_at)}</p>}
            {proofUrl ? (
              <div className="mt-3">
                <p className="mb-2 text-sm font-bold">Bukti pembayaran</p>
                {o.payment_proof_path?.endsWith('.pdf') ? (
                  <a href={proofUrl} target="_blank" rel="noreferrer" className="btn-secondary w-full">Buka PDF</a>
                ) : (
                  <a href={proofUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-line bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={proofUrl} alt="Bukti pembayaran" className="max-h-96 w-full object-contain" />
                  </a>
                )}
                <p className="mt-1 text-xs text-ink-faint">Tautan berlaku 5 menit. Muat ulang halaman jika kedaluwarsa.</p>
              </div>
            ) : o.payment_method !== 'cod' ? (
              <p className="mt-3 text-[14px] text-ink-muted">Belum ada bukti pembayaran.</p>
            ) : null}
          </Panel>

          <Panel title="Status">
            <OrderTimeline status={o.status} />
            {o.cancel_reason && <p className="mt-3 rounded-xl bg-red-50 p-3 text-[14px] text-red-900">Alasan batal: {o.cancel_reason}</p>}
          </Panel>
          <Link href="/admin/orders" className="btn-secondary w-full">Kembali ke daftar</Link>
        </div>
      </div>
    </div>
  )
}
