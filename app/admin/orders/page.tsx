import type { Metadata } from 'next'
import Link from 'next/link'
import { ClipboardList, Search } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { STAFF } from '@/lib/permissions'
import { isYmd, jakartaEndExclusive, jakartaStart } from '@/lib/dates'
import { formatDateTime, rupiah, cn } from '@/lib/utils'
import { METHOD_LABEL, ORDER_LABEL, ORDER_TONE, PAYMENT_LABEL, PAYMENT_TONE } from '@/lib/status'
import { Badge, EmptyState } from '@/components/ui'
import { Pagination } from '@/components/pagination'
import type { OrderStatus, PaymentStatus, PaymentMethod } from '@/types'

export const metadata: Metadata = { title: 'Pesanan' }

type SP = { status?: string; payment?: string; q?: string; from?: string; to?: string; page?: string }
const PER = 20
const STATUS_TABS: Array<[string, string]> = [['', 'Semua'], ['new', 'Baru'], ['confirmed', 'Dikonfirmasi'], ['processing', 'Disiapkan'], ['ready', 'Siap'], ['delivering', 'Diantar'], ['completed', 'Selesai'], ['cancelled', 'Batal']]

export default async function AdminOrders({ searchParams }: { searchParams: Promise<SP> }) {
  await requireRole(STAFF)
  const sp = await searchParams
  const admin = createAdminClient()
  const page = Math.max(1, Number(sp.page) || 1)
  const status = STATUS_TABS.some(([v]) => v === sp.status) ? sp.status || '' : ''
  const payment = ['pending', 'proof_uploaded', 'verified', 'failed', 'cod'].includes(sp.payment ?? '') ? sp.payment! : ''
  const q = (sp.q ?? '').replace(/[,()%*\\]/g, ' ').trim().slice(0, 40)

  let query = admin
    .from('orders')
    .select('id,order_number,status,payment_method,payment_status,total_idr,created_at,address_snapshot', { count: 'exact' })
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  if (payment) query = query.eq('payment_status', payment)
  if (isYmd(sp.from)) query = query.gte('created_at', jakartaStart(sp.from))
  if (isYmd(sp.to)) query = query.lt('created_at', jakartaEndExclusive(sp.to))
  if (q) {
    query = query.or(`order_number.ilike.%${q}%,address_snapshot->>recipient_name.ilike.%${q}%,address_snapshot->>phone.ilike.%${q}%`)
  }
  const { data, count } = await query.range((page - 1) * PER, page * PER - 1)
  const pages = Math.max(1, Math.ceil((count ?? 0) / PER))

  const { data: counts } = await admin.from('orders').select('status')
  const tally = (counts ?? []).reduce<Record<string, number>>((m, r) => ((m[r.status] = (m[r.status] ?? 0) + 1), m), {})

  const href = (o: Partial<SP>) => {
    const p = new URLSearchParams()
    const m = { status, payment, q, from: sp.from, to: sp.to, ...o }
    for (const [k, v] of Object.entries(m)) if (v) p.set(k, String(v))
    const s = p.toString()
    return s ? `/admin/orders?${s}` : '/admin/orders'
  }

  return (
    <div className="space-y-4">
      <form className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]" role="search">
        <label className="relative sm:col-span-1">
          <span className="sr-only">Cari pesanan</span>
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input name="q" defaultValue={q} className="input pl-10" placeholder="No. pesanan, nama, atau HP" />
        </label>
        <input type="hidden" name="status" value={status} />
        <select name="payment" defaultValue={payment} className="input" aria-label="Status pembayaran">
          <option value="">Semua pembayaran</option>
          {(['pending', 'proof_uploaded', 'verified', 'failed', 'cod'] as PaymentStatus[]).map((p) => <option key={p} value={p}>{PAYMENT_LABEL[p]}</option>)}
        </select>
        <input type="date" name="from" defaultValue={sp.from} className="input" aria-label="Dari tanggal" />
        <input type="date" name="to" defaultValue={sp.to} className="input" aria-label="Sampai tanggal" />
        <button className="btn-primary">Terapkan</button>
      </form>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
        {STATUS_TABS.map(([v, label]) => (
          <Link key={v} role="tab" aria-selected={status === v} href={href({ status: v, page: undefined })} className={cn('chip', status === v && 'chip-active')}>
            {label}
            {v && tally[v] ? <span className={cn('grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold', status === v ? 'bg-white text-brand-700' : v === 'new' ? 'bg-accent-500 text-white' : 'bg-cream-200')}>{tally[v]}</span> : null}
          </Link>
        ))}
      </div>

      {(data ?? []).length === 0 ? (
        <EmptyState icon={ClipboardList} title="Tidak ada pesanan" text="Coba ubah filter atau kata pencarian." />
      ) : (
        <>
          <ul className="space-y-3 lg:hidden">
            {(data ?? []).map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="card block p-4 active:scale-[.99]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="font-extrabold">{o.order_number}</p><p className="truncate text-[14px] text-ink-soft">{(o.address_snapshot as { recipient_name?: string })?.recipient_name}</p></div>
                    <Badge tone={ORDER_TONE[o.status as OrderStatus]}>{ORDER_LABEL[o.status as OrderStatus]}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                    <div><p className="text-lg font-extrabold">{rupiah(o.total_idr)}</p><p className="text-xs text-ink-muted">{formatDateTime(o.created_at)}</p></div>
                    <Badge tone={PAYMENT_TONE[o.payment_status as PaymentStatus]}>{PAYMENT_LABEL[o.payment_status as PaymentStatus]}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="card hidden overflow-hidden lg:block">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-cream-100 text-xs uppercase tracking-wide text-ink-muted">
                <tr><th className="px-4 py-3">Pesanan</th><th className="px-4 py-3">Pelanggan</th><th className="px-4 py-3">Bayar</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(data ?? []).map((o) => {
                  const a = o.address_snapshot as { recipient_name?: string; phone?: string }
                  return (
                    <tr key={o.id} className="hover:bg-cream-100">
                      <td className="px-4 py-3"><Link href={`/admin/orders/${o.id}`} className="font-bold text-brand-700 hover:underline">{o.order_number}</Link><p className="text-xs text-ink-muted">{formatDateTime(o.created_at)}</p></td>
                      <td className="px-4 py-3"><p className="font-semibold">{a?.recipient_name}</p><p className="text-xs text-ink-muted">{a?.phone}</p></td>
                      <td className="px-4 py-3"><p>{METHOD_LABEL[o.payment_method as PaymentMethod]}</p><Badge tone={PAYMENT_TONE[o.payment_status as PaymentStatus]} className="mt-1">{PAYMENT_LABEL[o.payment_status as PaymentStatus]}</Badge></td>
                      <td className="px-4 py-3"><Badge tone={ORDER_TONE[o.status as OrderStatus]}>{ORDER_LABEL[o.status as OrderStatus]}</Badge></td>
                      <td className="px-4 py-3 text-right font-extrabold">{rupiah(o.total_idr)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pages} hrefFor={(p) => href({ page: p > 1 ? String(p) : undefined })} />
        </>
      )}
    </div>
  )
}
