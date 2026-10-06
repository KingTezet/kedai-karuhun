import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle2, CircleAlert, Clock, MapPin, MessageCircle, PartyPopper } from 'lucide-react'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getSettings } from '@/lib/store'
import { signedProofUrl } from '@/lib/proof'
import { formatDateTime, num, rupiah, waLink } from '@/lib/utils'
import { METHOD_LABEL, ORDER_HINT, ORDER_LABEL, ORDER_TONE, PAYMENT_LABEL, PAYMENT_TONE } from '@/lib/status'
import { Badge, PageHeader } from '@/components/ui'
import { CopyButton } from '@/components/copy-button'
import { ProofUpload } from '@/components/proof-upload'
import { OrderTimeline } from '@/components/order-timeline'
import { AutoRefresh } from '@/components/auto-refresh'
import type { Order, OrderItem } from '@/types'

export const metadata: Metadata = { title: 'Detail pesanan', robots: { index: false } }

export default async function OrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ baru?: string }> }) {
  const { id } = await params
  const { baru } = await searchParams
  const user = await requireUser(`/orders/${id}`)
  const sb = await createClient()
  const { data } = await sb.from('orders').select('*').eq('id', id).eq('buyer_id', user.id).maybeSingle()
  if (!data) notFound()
  const o = data as Order

  const [{ data: items }, settings, proofUrl] = await Promise.all([
    sb.from('order_items').select('*').eq('order_id', id).order('created_at'),
    getSettings(),
    signedProofUrl(o.payment_proof_path),
  ])
  const lines = (items ?? []) as OrderItem[]
  const addr = o.address_snapshot ?? {}
  const active = !['completed', 'cancelled'].includes(o.status)
  const needsPay = o.payment_method !== 'cod' && o.status !== 'cancelled' && o.payment_status !== 'verified'
  const canUpload = needsPay && ['pending', 'failed', 'proof_uploaded'].includes(o.payment_status)

  return (
    <div className="page py-5 sm:py-8">
      {active && <AutoRefresh seconds={20} />}
      <PageHeader title={o.order_number} subtitle={formatDateTime(o.created_at)} back={{ href: '/orders', label: 'Pesanan saya' }} action={<Badge tone={ORDER_TONE[o.status]} className="px-3 py-1.5 text-sm">{ORDER_LABEL[o.status]}</Badge>} />

      {baru === '1' && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl bg-brand-600 p-4 text-white shadow-card">
          <PartyPopper size={26} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-lg font-extrabold">Pesanan berhasil dibuat!</p>
            <p className="text-[15px] text-white/90">
              {o.payment_method === 'cod' ? 'Siapkan uang pas saat pesanan datang.' : 'Selesaikan pembayaran di bawah, lalu kirim bukti pembayarannya.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-4">
          {/* Pembayaran */}
          <section className="card p-4 sm:p-5" aria-labelledby="bayar">
            <div className="flex items-center justify-between gap-3">
              <h2 id="bayar" className="text-lg font-bold">Pembayaran</h2>
              {o.status !== 'cancelled' && <Badge tone={PAYMENT_TONE[o.payment_status]}>{PAYMENT_LABEL[o.payment_status]}</Badge>}
            </div>
            <p className="mt-1 text-[15px] text-ink-muted">{METHOD_LABEL[o.payment_method]}</p>

            {o.payment_status === 'failed' && (
              <div className="mt-3 flex gap-3 rounded-xl bg-red-50 p-3 text-red-900" role="alert">
                <CircleAlert size={22} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Bukti pembayaran ditolak</p>
                  {o.payment_note && <p className="text-[14px]">Alasan: {o.payment_note}</p>}
                  <p className="text-[14px]">Silakan kirim bukti yang benar.</p>
                </div>
              </div>
            )}
            {o.payment_status === 'verified' && (
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-brand-50 p-3 text-brand-800">
                <CheckCircle2 size={22} /> <b>Pembayaran sudah diterima. Terima kasih!</b>
              </div>
            )}
            {o.payment_status === 'proof_uploaded' && (
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-sky-50 p-3 text-sky-900">
                <Clock size={22} /> <b>Bukti terkirim. Menunggu verifikasi toko.</b>
              </div>
            )}

            {needsPay && (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-cream-100 p-4">
                  <p className="text-sm text-ink-muted">Total yang harus dibayar</p>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-3xl font-extrabold text-brand-700">{rupiah(o.total_idr)}</p>
                    <CopyButton value={String(o.total_idr)} label="Salin nominal" />
                  </div>
                </div>

                {o.payment_method === 'qris' && (
                  <div className="rounded-xl border border-line p-4 text-center">
                    {settings?.qris_image_url ? (
                      <>
                        <p className="mb-3 text-[15px] font-semibold">Scan QRIS {settings.store_name}</p>
                        <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-xl border border-line bg-white">
                          <Image src={settings.qris_image_url} alt={`QRIS ${settings.store_name}`} fill sizes="280px" className="object-contain p-2" />
                        </div>
                        <p className="mt-3 text-[13px] text-ink-muted">Tahan gambar untuk menyimpan, lalu scan dari galeri di aplikasi pembayaranmu.</p>
                      </>
                    ) : (
                      <p className="text-[15px] text-ink-muted">QRIS belum tersedia. Hubungi toko lewat WhatsApp untuk minta QRIS.</p>
                    )}
                  </div>
                )}

                {o.payment_method === 'transfer' && (
                  <div className="space-y-3 rounded-xl border border-line p-4">
                    {settings?.bank_account_number ? (
                      <>
                        <div>
                          <p className="text-sm text-ink-muted">Bank</p>
                          <p className="text-lg font-bold">{settings.bank_name || '—'}</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm text-ink-muted">Nomor rekening</p>
                            <p className="text-2xl font-extrabold tracking-wide">{settings.bank_account_number}</p>
                          </div>
                          <CopyButton value={settings.bank_account_number} label="Salin no. rekening" />
                        </div>
                        <div>
                          <p className="text-sm text-ink-muted">Atas nama</p>
                          <p className="text-lg font-bold">{settings.bank_account_name || '—'}</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-[15px] text-ink-muted">Nomor rekening belum tersedia. Hubungi toko lewat WhatsApp.</p>
                    )}
                  </div>
                )}

                <p className="rounded-xl bg-sky-50 p-3 text-[13px] text-sky-900">🔒 Jangan pernah membagikan PIN, OTP, atau password bank ke siapa pun, termasuk toko.</p>
              </div>
            )}

            {o.payment_method === 'cod' && o.status !== 'cancelled' && (
              <p className="mt-3 rounded-xl bg-cream-100 p-4 text-[15px]">Siapkan uang pas <b>{rupiah(o.total_idr)}</b> untuk kurir saat pesanan sampai.</p>
            )}

            {proofUrl && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-bold">Bukti yang kamu kirim</p>
                {o.payment_proof_path?.endsWith('.pdf') ? (
                  <a href={proofUrl} target="_blank" rel="noreferrer" className="btn-secondary w-full">Buka file PDF</a>
                ) : (
                  <a href={proofUrl} target="_blank" rel="noreferrer" className="relative block h-40 w-full max-w-xs overflow-hidden rounded-xl border border-line bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={proofUrl} alt="Bukti pembayaran" className="h-full w-full object-contain" />
                  </a>
                )}
              </div>
            )}
            {canUpload && <div className="mt-4"><ProofUpload orderId={o.id} hasProof={!!o.payment_proof_path} /></div>}
          </section>

          {/* Item */}
          <section className="card p-4 sm:p-5" aria-labelledby="item">
            <h2 id="item" className="text-lg font-bold">Rincian pesanan</h2>
            <ul className="mt-3 divide-y divide-line">
              {lines.map((x) => (
                <li key={x.id} className="flex justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{x.product_name_snapshot}</p>
                    <p className="text-[14px] text-ink-muted">{num(x.quantity)} {x.unit_snapshot} × {rupiah(x.unit_price_idr)}</p>
                  </div>
                  <p className="shrink-0 font-bold">{rupiah(x.line_total_idr)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-2 border-t border-line pt-3 text-[15px]">
              <div className="flex justify-between"><dt className="text-ink-muted">Subtotal</dt><dd className="font-semibold">{rupiah(o.subtotal_idr)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Ongkir{addr.zone_name ? ` (${addr.zone_name})` : ''}</dt><dd className="font-semibold">{o.delivery_fee_idr === 0 ? 'Gratis' : rupiah(o.delivery_fee_idr)}</dd></div>
              <div className="flex items-baseline justify-between border-t border-line pt-3"><dt className="font-bold">Total</dt><dd className="text-2xl font-extrabold text-brand-700">{rupiah(o.total_idr)}</dd></div>
            </dl>
          </section>
        </div>

        <div className="space-y-4">
          <section className="card p-4 sm:p-5" aria-labelledby="status">
            <h2 id="status" className="mb-1 text-lg font-bold">Status pesanan</h2>
            <p className="mb-4 text-[14px] text-ink-muted">{ORDER_HINT[o.status]}</p>
            <OrderTimeline status={o.status} />
            {o.status === 'cancelled' && o.cancel_reason && <p className="mt-3 rounded-xl bg-red-50 p-3 text-[14px] text-red-900">Alasan: {o.cancel_reason}</p>}
          </section>

          <section className="card p-4 sm:p-5" aria-labelledby="kirim">
            <h2 id="kirim" className="mb-2 flex items-center gap-2 text-lg font-bold"><MapPin size={20} className="text-brand-600" /> Pengantaran</h2>
            <p className="font-semibold">{addr.recipient_name} <span className="font-normal text-ink-muted">· {addr.phone}</span></p>
            <p className="text-[15px] text-ink-soft">{addr.address_line}</p>
            {addr.notes && <p className="text-[14px] text-ink-muted">Patokan: {addr.notes}</p>}
            {o.note && <p className="mt-3 rounded-xl bg-cream-100 p-3 text-[14px]"><b>Catatanmu:</b> {o.note}</p>}
          </section>

          {settings?.whatsapp && (
            <a
              href={waLink(settings.whatsapp, `Halo ${settings.store_name}, saya mau tanya pesanan ${o.order_number}.`)}
              target="_blank"
              rel="noreferrer"
              className="btn-soft btn-lg w-full"
            >
              <MessageCircle size={20} /> Tanya toko via WhatsApp
            </a>
          )}
          <Link href="/products" className="btn-secondary w-full">Belanja lagi</Link>
        </div>
      </div>
    </div>
  )
}
