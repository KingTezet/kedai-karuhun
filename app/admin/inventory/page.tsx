import type { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { STAFF } from '@/lib/permissions'
import { formatDateTime, num, cn } from '@/lib/utils'
import { MOVEMENT_LABEL } from '@/lib/status'
import { Badge } from '@/components/ui'
import { Empty, Panel } from '@/components/admin/ui'
import { StockList } from '@/components/admin/stock-list'
import type { Product } from '@/types'

export const metadata: Metadata = { title: 'Stok' }

export default async function AdminInventory({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string; focus?: string }> }) {
  await requireRole(STAFF)
  const sp = await searchParams
  const admin = createAdminClient()
  const q = (sp.q ?? '').replace(/[,()%*\\]/g, ' ').trim().slice(0, 40)
  let pq = admin.from('products').select('*').order('stock_quantity').limit(300)
  if (q) pq = pq.or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
  const [{ data: all }, { data: moves }] = await Promise.all([
    pq,
    admin.from('inventory_movements').select('id,movement_type,quantity,note,created_at,products(name,unit)').order('created_at', { ascending: false }).limit(25),
  ])
  const products = ((all ?? []) as Product[]).filter((p) => (sp.filter === 'low' ? p.stock_quantity <= p.low_stock_threshold : true))
  const lowCount = ((all ?? []) as Product[]).filter((p) => p.stock_quantity <= p.low_stock_threshold).length

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <form role="search" className="relative flex-1">
          <span className="sr-only">Cari produk</span>
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input name="q" defaultValue={q} className="input pl-10" placeholder="Cari produk atau SKU" />
          {sp.filter && <input type="hidden" name="filter" value={sp.filter} />}
        </form>
        <div className="flex gap-2">
          <Link href="/admin/inventory" className={cn('chip', sp.filter !== 'low' && 'chip-active')}>Semua</Link>
          <Link href="/admin/inventory?filter=low" className={cn('chip', sp.filter === 'low' && 'chip-active')}>Menipis {lowCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[11px] font-bold text-white">{lowCount}</span>}</Link>
        </div>
      </div>

      {products.length === 0 ? <Empty text={sp.filter === 'low' ? 'Tidak ada stok yang menipis.' : 'Produk tidak ditemukan.'} /> : <StockList products={products} focusId={sp.focus} />}

      <Panel title="Riwayat stok terbaru">
        {(moves ?? []).length === 0 ? <Empty text="Belum ada pergerakan stok." /> : (
          <ul className="divide-y divide-line">
            {(moves ?? []).map((m) => {
              const p = m.products as unknown as { name: string; unit: string } | null
              const q = Number(m.quantity)
              return (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-[14px]">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p?.name}</span>
                    <span className="block text-xs text-ink-muted">{MOVEMENT_LABEL[m.movement_type] ?? m.movement_type}{m.note ? ` · ${m.note}` : ''} · {formatDateTime(m.created_at)}</span>
                  </span>
                  <Badge tone={q >= 0 ? 'good' : 'warn'}>{q > 0 ? '+' : ''}{num(q)} {p?.unit}</Badge>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </div>
  )
}
