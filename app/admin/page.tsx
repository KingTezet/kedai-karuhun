import Link from 'next/link'
import { AlertTriangle, ClipboardList, PackageCheck, Wallet, ShoppingBag, ChevronRight } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { STAFF, can } from '@/lib/permissions'
import { jakartaEndExclusive, jakartaStart, jakartaToday, monthStart } from '@/lib/dates'
import { formatDateTime, num, rupiah, timeAgo } from '@/lib/utils'
import { ORDER_LABEL, ORDER_TONE, PAYMENT_LABEL, PAYMENT_TONE } from '@/lib/status'
import { Badge } from '@/components/ui'
import { Empty, Panel, StatCard } from '@/components/admin/ui'
import type { OrderStatus } from '@/types'

export default async function AdminDashboard() {
  const profile = await requireRole(STAFF)
  const admin = createAdminClient()
  const today = jakartaToday()
  const from = jakartaStart(today)
  const to = jakartaEndExclusive(today)
  const showMoney = can.viewFinance(profile.role)

  const [newOrders, todayOrders, income, products, recent, events, proofs] = await Promise.all([
    admin.from('orders').select('id,order_number,total_idr,payment_method,payment_status,created_at,address_snapshot', { count: 'exact' }).eq('status', 'new').order('created_at').limit(5),
    admin.from('orders').select('status,total_idr').gte('created_at', from).lt('created_at', to),
    showMoney
      ? admin.from('financial_transactions').select('type,amount_idr,occurred_at').gte('occurred_at', monthStart(today))
      : Promise.resolve({ data: [] as Array<{ type: string; amount_idr: number; occurred_at: string }> }),
    admin.from('products').select('id,name,unit,stock_quantity,low_stock_threshold').eq('is_active', true).order('stock_quantity').limit(200),
    admin.from('orders').select('id,order_number,status,payment_status,total_idr,created_at,address_snapshot').order('created_at', { ascending: false }).limit(6),
    admin.from('order_events').select('id,type,to_status,note,created_at,order_id,orders(order_number)').order('created_at', { ascending: false }).limit(8),
    admin.from('orders').select('id', { count: 'exact', head: true }).eq('payment_status', 'proof_uploaded').neq('status', 'cancelled'),
  ])

  const t = todayOrders.data ?? []
  const valid = t.filter((o) => o.status !== 'cancelled')
  const byStatus = valid.reduce<Record<string, number>>((m, o) => ((m[o.status] = (m[o.status] ?? 0) + 1), m), {})
  const incToday = (income.data ?? []).filter((x) => x.type === 'income' && x.occurred_at === today).reduce((s, x) => s + Number(x.amount_idr), 0)
  const incMonth = (income.data ?? []).filter((x) => x.type === 'income').reduce((s, x) => s + Number(x.amount_idr), 0)
  const low = (products.data ?? []).filter((p) => Number(p.stock_quantity) <= Number(p.low_stock_threshold))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pesanan baru" value={newOrders.count ?? 0} hint={(newOrders.count ?? 0) > 0 ? 'Perlu dikonfirmasi' : 'Semua sudah ditangani'} tone={(newOrders.count ?? 0) > 0 ? 'warn' : 'neutral'} href="/admin/orders?status=new" icon={ClipboardList} />
        <StatCard label="Pesanan hari ini" value={valid.length} hint={`Nilai ${rupiah(valid.reduce((s, o) => s + Number(o.total_idr), 0))}`} href="/admin/orders" icon={ShoppingBag} />
        {showMoney ? (
          <StatCard label="Pendapatan hari ini" value={rupiah(incToday)} hint={`Bulan ini ${rupiah(incMonth)}`} tone="good" href="/admin/finance" icon={Wallet} />
        ) : (
          <StatCard label="Bukti bayar baru" value={proofs.count ?? 0} hint="Menunggu verifikasi" icon={Wallet} href="/admin/orders?payment=proof_uploaded" />
        )}
        <StatCard label="Stok menipis" value={low.length} hint={low.length ? 'Segera restok' : 'Stok aman'} tone={low.length ? 'warn' : 'neutral'} href="/admin/inventory?filter=low" icon={AlertTriangle} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-5">
          <Panel title="Perlu ditangani" action={<Link href="/admin/orders?status=new" className="text-sm font-bold text-brand-700">Lihat semua</Link>}>
            {(newOrders.data ?? []).length === 0 ? (
              <Empty text="Tidak ada pesanan baru. Kerja bagus! 🎉" />
            ) : (
              <ul className="divide-y divide-line">
                {(newOrders.data ?? []).map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/orders/${o.id}`} className="flex min-h-[64px] items-center gap-3 py-2">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-100 text-accent-700"><PackageCheck size={22} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold">{o.order_number}</span>
                        <span className="block truncate text-[13px] text-ink-muted">{(o.address_snapshot as { recipient_name?: string })?.recipient_name} · {timeAgo(o.created_at)}</span>
                      </span>
                      <span className="text-right">
                        <span className="block font-extrabold">{rupiah(o.total_idr)}</span>
                        <Badge tone={PAYMENT_TONE[o.payment_status as keyof typeof PAYMENT_TONE]} className="mt-0.5">{PAYMENT_LABEL[o.payment_status as keyof typeof PAYMENT_LABEL]}</Badge>
                      </span>
                      <ChevronRight size={18} className="shrink-0 text-ink-faint" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Status pesanan hari ini">
            {valid.length === 0 ? (
              <Empty text="Belum ada pesanan hari ini." />
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.entries(byStatus).map(([s, n]) => (
                  <Badge key={s} tone={ORDER_TONE[s as OrderStatus]} className="px-3 py-2 text-[13px]">{ORDER_LABEL[s as OrderStatus]}: {n}</Badge>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Pesanan terbaru">
            <ul className="divide-y divide-line">
              {(recent.data ?? []).map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex min-h-[56px] items-center justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <span className="block font-semibold">{o.order_number}</span>
                      <span className="block text-[13px] text-ink-muted">{formatDateTime(o.created_at)}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <span className="font-bold">{rupiah(o.total_idr)}</span>
                      <Badge tone={ORDER_TONE[o.status as OrderStatus]}>{ORDER_LABEL[o.status as OrderStatus]}</Badge>
                    </span>
                  </Link>
                </li>
              ))}
              {(recent.data ?? []).length === 0 && <li><Empty text="Belum ada pesanan." /></li>}
            </ul>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Stok menipis" action={<Link href="/admin/inventory?filter=low" className="text-sm font-bold text-brand-700">Kelola</Link>}>
            {low.length === 0 ? (
              <Empty text="Semua stok aman." />
            ) : (
              <ul className="divide-y divide-line">
                {low.slice(0, 8).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0 truncate font-semibold">{p.name}</span>
                    <Badge tone={Number(p.stock_quantity) <= 0 ? 'bad' : 'warn'}>{Number(p.stock_quantity) <= 0 ? 'Habis' : `Sisa ${num(p.stock_quantity)} ${p.unit}`}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Aktivitas terbaru">
            {(events.data ?? []).length === 0 ? (
              <Empty text="Belum ada aktivitas." />
            ) : (
              <ul className="space-y-3">
                {(events.data ?? []).map((e) => {
                  const on = (e.orders as unknown as { order_number?: string } | null)?.order_number
                  const text =
                    e.type === 'created' ? 'Pesanan dibuat'
                    : e.type === 'status' ? `Status → ${ORDER_LABEL[e.to_status as OrderStatus] ?? e.to_status}`
                    : e.type === 'proof_uploaded' ? 'Bukti bayar dikirim'
                    : e.type === 'payment_verified' ? 'Pembayaran diverifikasi'
                    : e.type === 'payment_failed' ? 'Pembayaran ditolak' : e.type
                  return (
                    <li key={e.id} className="flex gap-3 text-[14px]">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <Link href={`/admin/orders/${e.order_id}`} className="font-semibold hover:underline">{on}</Link> · {text}
                        <span className="block text-xs text-ink-faint">{timeAgo(e.created_at)}</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
