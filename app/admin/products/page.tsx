import type { Metadata } from 'next'
import Link from 'next/link'
import { Package, Plus, Search } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { MANAGER } from '@/lib/permissions'
import { num, rupiah, cn } from '@/lib/utils'
import { Badge, EmptyState, ProductImage } from '@/components/ui'
import { Pagination } from '@/components/pagination'
import type { Category, Product } from '@/types'

export const metadata: Metadata = { title: 'Produk' }
const PER = 20

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string; kategori?: string; status?: string; page?: string }> }) {
  await requireRole(MANAGER)
  const sp = await searchParams
  const admin = createAdminClient()
  const page = Math.max(1, Number(sp.page) || 1)
  const q = (sp.q ?? '').replace(/[,()%*\\]/g, ' ').trim().slice(0, 40)

  let query = admin.from('products').select('*, category:categories(id,name,slug)', { count: 'exact' }).order('updated_at', { ascending: false })
  if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
  if (sp.kategori) query = query.eq('category_id', sp.kategori)
  if (sp.status === 'aktif') query = query.eq('is_active', true)
  if (sp.status === 'arsip') query = query.eq('is_active', false)
  const [{ data, count }, { data: cats }] = await Promise.all([query.range((page - 1) * PER, page * PER - 1), admin.from('categories').select('id,name').order('sort_order')])
  const pages = Math.max(1, Math.ceil((count ?? 0) / PER))
  const products = (data ?? []) as unknown as Product[]
  const href = (o: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ q, kategori: sp.kategori, status: sp.status, ...o })) if (v) p.set(k, v)
    const s = p.toString()
    return s ? `/admin/products?${s}` : '/admin/products'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] text-ink-muted">{count ?? 0} produk</p>
        <Link href="/admin/products/new" className="btn-primary"><Plus size={18} /> Tambah produk</Link>
      </div>

      <form className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
        <label className="relative"><span className="sr-only">Cari produk</span><Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" /><input name="q" defaultValue={q} className="input pl-10" placeholder="Nama atau SKU" /></label>
        <select name="kategori" defaultValue={sp.kategori ?? ''} className="input" aria-label="Kategori"><option value="">Semua kategori</option>{((cats ?? []) as Pick<Category, 'id' | 'name'>[]).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select name="status" defaultValue={sp.status ?? ''} className="input" aria-label="Status"><option value="">Semua status</option><option value="aktif">Aktif</option><option value="arsip">Diarsipkan</option></select>
        <button className="btn-primary">Terapkan</button>
      </form>

      {products.length === 0 ? (
        <EmptyState icon={Package} title="Belum ada produk" text="Tambahkan produk pertama untuk mulai berjualan." action={{ label: 'Tambah produk', href: '/admin/products/new' }} />
      ) : (
        <>
          <ul className="space-y-3">
            {products.map((p) => {
              const low = p.stock_quantity <= p.low_stock_threshold
              return (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className={cn('card flex items-center gap-3 p-3 transition active:scale-[.99] hover:border-brand-300', !p.is_active && 'opacity-70')}>
                    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-200"><ProductImage src={p.image_url} name={p.name} sizes="64px" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{p.name}</span>
                      <span className="block text-[13px] text-ink-muted">{p.category?.name ?? 'Tanpa kategori'}{p.sku ? ` · ${p.sku}` : ''}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="font-extrabold text-brand-700">{rupiah(p.price_idr)}<span className="text-xs font-normal text-ink-muted"> /{p.unit}</span></span>
                        {!p.is_active && <Badge>Arsip</Badge>}
                        {p.is_featured && <Badge tone="info">Unggulan</Badge>}
                      </span>
                    </span>
                    <span className="shrink-0 text-right"><Badge tone={p.stock_quantity <= 0 ? 'bad' : low ? 'warn' : 'good'}>{p.stock_quantity <= 0 ? 'Habis' : `${num(p.stock_quantity)} ${p.unit}`}</Badge></span>
                  </Link>
                </li>
              )
            })}
          </ul>
          <Pagination page={page} pages={pages} hrefFor={(p) => href({ page: p > 1 ? String(p) : undefined })} />
        </>
      )}
    </div>
  )
}
