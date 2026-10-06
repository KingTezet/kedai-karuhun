import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, ReceiptText } from 'lucide-react'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime, rupiah, cn } from '@/lib/utils'
import { ORDER_LABEL, ORDER_TONE, PAYMENT_LABEL, PAYMENT_TONE } from '@/lib/status'
import { Badge, EmptyState, PageHeader } from '@/components/ui'
import { AutoRefresh } from '@/components/auto-refresh'
import type { Order } from '@/types'

export const metadata: Metadata = { title: 'Pesanan saya', robots: { index: false } }

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  const user = await requireUser('/orders')
  const sb = await createClient()
  const { data } = await sb
    .from('orders')
    .select('id,order_number,status,payment_method,payment_status,total_idr,created_at')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)
  const all = (data ?? []) as Pick<Order, 'id' | 'order_number' | 'status' | 'payment_method' | 'payment_status' | 'total_idr' | 'created_at'>[]
  const done = tab === 'selesai'
  const list = all.filter((o) => (done ? ['completed', 'cancelled'].includes(o.status) : !['completed', 'cancelled'].includes(o.status)))
  const activeCount = all.filter((o) => !['completed', 'cancelled'].includes(o.status)).length

  const ids = list.map((o) => o.id)
  const { data: items } = ids.length ? await sb.from('order_items').select('order_id,product_name_snapshot').in('order_id', ids) : { data: [] }
  const names = new Map<string, string[]>()
  for (const it of items ?? []) names.set(it.order_id, [...(names.get(it.order_id) ?? []), it.product_name_snapshot])

  return (
    <div className="page py-5 sm:py-8">
      {activeCount > 0 && !done && <AutoRefresh seconds={30} />}
      <PageHeader title="Pesanan saya" subtitle="Pantau status pesananmu di sini" />

      <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-cream-200 p-1" role="tablist">
        <Link href="/orders" role="tab" aria-selected={!done} className={cn('btn h-11 text-[15px]', !done ? 'bg-white shadow-card' : 'text-ink-muted')}>
          Berjalan{activeCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[11px] font-bold text-white">{activeCount}</span>}
        </Link>
        <Link href="/orders?tab=selesai" role="tab" aria-selected={done} className={cn('btn h-11 text-[15px]', done ? 'bg-white shadow-card' : 'text-ink-muted')}>
          Riwayat
        </Link>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={done ? 'Belum ada riwayat' : 'Tidak ada pesanan berjalan'}
          text={done ? 'Pesanan yang selesai atau dibatalkan akan muncul di sini.' : 'Yuk belanja kebutuhan harianmu.'}
          action={{ label: 'Mulai belanja', href: '/products' }}
        />
      ) : (
        <ul className="space-y-3">
          {list.map((o) => {
            const n = names.get(o.id) ?? []
            return (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="card block p-4 transition active:scale-[.99]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-extrabold">{o.order_number}</p>
                      <p className="text-[13px] text-ink-muted">{formatDateTime(o.created_at)}</p>
                    </div>
                    <Badge tone={ORDER_TONE[o.status]}>{ORDER_LABEL[o.status]}</Badge>
                  </div>
                  {n.length > 0 && (
                    <p className="mt-2 line-clamp-1 text-[14px] text-ink-soft">
                      {n.slice(0, 2).join(', ')}{n.length > 2 ? ` +${n.length - 2} lainnya` : ''}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-extrabold">{rupiah(o.total_idr)}</span>
                      {o.status !== 'cancelled' && <Badge tone={PAYMENT_TONE[o.payment_status]}>{PAYMENT_LABEL[o.payment_status]}</Badge>}
                    </div>
                    <ChevronRight className="shrink-0 text-ink-faint" />
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
