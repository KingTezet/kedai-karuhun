'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import type { Category, Product } from '@/types'
import { slugify, cn, num } from '@/lib/utils'
import { useToast } from '@/lib/toast'
import { Sheet } from '@/components/sheet'
import { Field, Spinner } from '@/components/ui'
import { ImageUpload } from '@/components/admin/image-upload'
import { Panel } from '@/components/admin/ui'

type State = {
  name: string; slug: string; sku: string; category_id: string; price_idr: string; compare_at_price_idr: string
  unit: string; short_description: string; description: string; low_stock_threshold: string; initial_stock: string
  image_url: string | null; is_active: boolean; is_featured: boolean
}
const UNITS = ['pcs', 'kg', 'gram', 'liter', 'pak', 'ikat', 'butir', 'botol', 'bungkus', 'dus']

export function ProductForm({ categories, product }: { categories: Category[]; product?: Product }) {
  const router = useRouter()
  const toast = useToast()
  const [s, setS] = useState<State>({
    name: product?.name ?? '', slug: product?.slug ?? '', sku: product?.sku ?? '', category_id: product?.category_id ?? '',
    price_idr: product ? String(product.price_idr) : '', compare_at_price_idr: product?.compare_at_price_idr ? String(product.compare_at_price_idr) : '',
    unit: product?.unit ?? 'pcs', short_description: product?.short_description ?? '', description: product?.description ?? '',
    low_stock_threshold: product ? String(product.low_stock_threshold) : '5', initial_stock: '0',
    image_url: product?.image_url ?? null, is_active: product?.is_active ?? true, is_featured: product?.is_featured ?? false,
  })
  const [slugTouched, setSlugTouched] = useState(!!product)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [confirm, setConfirm] = useState<'delete' | null>(null)
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((x) => ({ ...x, [k]: v }))

  const body = () => ({
    name: s.name.trim(), slug: s.slug.trim(), sku: s.sku.trim() || null, category_id: s.category_id || null,
    price_idr: Number(s.price_idr), compare_at_price_idr: s.compare_at_price_idr ? Number(s.compare_at_price_idr) : null,
    unit: s.unit.trim(), short_description: s.short_description.trim() || null, description: s.description.trim() || null,
    low_stock_threshold: Number(s.low_stock_threshold || 0), image_url: s.image_url, is_active: s.is_active, is_featured: s.is_featured,
    ...(product ? { id: product.id } : { initial_stock: Number(s.initial_stock || 0) }),
  })

  const save = async (override?: Partial<ReturnType<typeof body>>) => {
    setBusy(true)
    setErr('')
    const res = await fetch('/api/admin/products', { method: product ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body(), ...override }) })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok || json.ok === false) {
      setErr(json.error || 'Gagal menyimpan.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return false
    }
    toast.success(product ? 'Produk diperbarui' : 'Produk ditambahkan')
    if (!product) router.replace('/admin/products')
    else router.refresh()
    return true
  }

  const remove = async () => {
    setBusy(true)
    const res = await fetch('/api/admin/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: product!.id }) })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    setConfirm(null)
    if (!res.ok || json.ok === false) return toast.error(json.error || 'Gagal menghapus.')
    toast.success('Produk dihapus')
    router.replace('/admin/products')
  }

  return (
    <form className="space-y-5 pb-24" onSubmit={(e) => { e.preventDefault(); save() }} noValidate>
      {err && <div className="rounded-2xl border border-red-300 bg-red-50 p-4 font-semibold text-red-800" role="alert">{err}</div>}

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Panel title="Foto produk"><ImageUpload value={s.image_url} onChange={(u) => set('image_url', u)} label="Foto utama" /></Panel>

        <div className="space-y-5">
          <Panel title="Informasi">
            <div className="space-y-4">
              <Field label="Nama produk" htmlFor="pn" required>
                <input id="pn" className="input" value={s.name} onChange={(e) => { set('name', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)) }} placeholder="Contoh: Telur Ayam Negeri" />
              </Field>
              <Field label="Alamat link (slug)" htmlFor="pslug" hint="Terisi otomatis dari nama. Dipakai di link produk, huruf kecil tanpa spasi.">
                <input id="pslug" className="input" value={s.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)) }} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Kategori" htmlFor="pc">
                  <select id="pc" className="input" value={s.category_id} onChange={(e) => set('category_id', e.target.value)}>
                    <option value="">Tanpa kategori</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="SKU (opsional)" htmlFor="ps" hint="Kode unik produk."><input id="ps" className="input" value={s.sku} onChange={(e) => set('sku', e.target.value)} /></Field>
              </div>
              <Field label="Deskripsi singkat" htmlFor="pd1" hint="Muncul di hasil pencarian."><input id="pd1" className="input" value={s.short_description} maxLength={160} onChange={(e) => set('short_description', e.target.value)} /></Field>
              <Field label="Deskripsi lengkap" htmlFor="pd2"><textarea id="pd2" className="input" value={s.description} onChange={(e) => set('description', e.target.value)} /></Field>
            </div>
          </Panel>

          <Panel title="Harga & satuan">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Harga jual (Rp)" htmlFor="pp" required><input id="pp" className="input" inputMode="numeric" value={s.price_idr} onChange={(e) => set('price_idr', e.target.value.replace(/\D/g, ''))} placeholder="25000" /></Field>
              <Field label="Harga coret (opsional)" htmlFor="pcp" hint="Harga sebelum diskon."><input id="pcp" className="input" inputMode="numeric" value={s.compare_at_price_idr} onChange={(e) => set('compare_at_price_idr', e.target.value.replace(/\D/g, ''))} /></Field>
              <Field label="Satuan" htmlFor="pu" required>
                <input id="pu" list="units" className="input" value={s.unit} onChange={(e) => set('unit', e.target.value)} />
                <datalist id="units">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
              </Field>
              <Field label="Batas stok menipis" htmlFor="pl" hint="Admin diberi tahu di bawah angka ini."><input id="pl" className="input" inputMode="decimal" value={s.low_stock_threshold} onChange={(e) => set('low_stock_threshold', e.target.value.replace(/[^\d.]/g, ''))} /></Field>
            </div>
          </Panel>

          <Panel title="Stok">
            {product ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[15px]">Stok saat ini: <b className="text-xl">{num(product.stock_quantity)} {product.unit}</b></p>
                <Link href={`/admin/inventory?focus=${product.id}`} className="btn-soft btn-sm">Atur stok</Link>
              </div>
            ) : (
              <Field label="Stok awal" htmlFor="pis" hint="Perubahan stok selanjutnya dicatat di menu Stok supaya ada riwayatnya.">
                <input id="pis" className="input" inputMode="decimal" value={s.initial_stock} onChange={(e) => set('initial_stock', e.target.value.replace(/[^\d.]/g, ''))} />
              </Field>
            )}
          </Panel>

          <Panel title="Tampil di toko">
            <div className="space-y-2">
              <Toggle checked={s.is_active} onChange={(v) => set('is_active', v)} title="Aktif dijual" text="Nonaktifkan untuk menyembunyikan dari toko (arsip)." />
              <Toggle checked={s.is_featured} onChange={(v) => set('is_featured', v)} title="Produk unggulan" text="Ditampilkan di bagian “Pilihan hari ini” beranda." />
            </div>
          </Panel>

          {product && (
            <Panel title="Zona berbahaya">
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-secondary" disabled={busy} onClick={async () => { const ok = await save({ is_active: !s.is_active }); if (ok) set('is_active', !s.is_active) }}>
                  {s.is_active ? <><Archive size={18} /> Arsipkan produk</> : <><ArchiveRestore size={18} /> Aktifkan kembali</>}
                </button>
                <button type="button" className="btn-danger-soft" onClick={() => setConfirm('delete')}><Trash2 size={18} /> Hapus produk</button>
              </div>
            </Panel>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(64px+var(--safe-b))] z-40 border-t border-line bg-white p-3 shadow-nav lg:bottom-0 lg:left-64">
        <div className="mx-auto flex max-w-6xl gap-3 lg:px-6">
          <Link href="/admin/products" className="btn-secondary btn-lg">Batal</Link>
          <button className={cn('btn-primary btn-lg flex-1')} disabled={busy}>{busy ? <><Spinner /> Menyimpan...</> : product ? 'Simpan perubahan' : 'Tambah produk'}</button>
        </div>
      </div>

      <Sheet open={confirm === 'delete'} onClose={() => setConfirm(null)} title="Hapus produk ini?" description="Tindakan ini tidak bisa dibatalkan. Jika pernah dipesan, arsipkan saja."
        footer={<div className="flex gap-3"><button type="button" className="btn-secondary flex-1" onClick={() => setConfirm(null)}>Batal</button><button type="button" className="btn-danger flex-1" onClick={remove} disabled={busy}>Ya, hapus</button></div>}>
        <p className="font-semibold">{product?.name}</p>
      </Sheet>
    </form>
  )
}

function Toggle({ checked, onChange, title, text }: { checked: boolean; onChange: (v: boolean) => void; title: string; text: string }) {
  return (
    <label className="flex min-h-[60px] cursor-pointer items-center gap-3 rounded-xl border border-line p-3">
      <span className="min-w-0 flex-1"><span className="block font-bold">{title}</span><span className="block text-[13px] text-ink-muted">{text}</span></span>
      <span className={cn('relative h-8 w-14 shrink-0 rounded-full transition', checked ? 'bg-brand-600' : 'bg-cream-300')}>
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={cn('absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all', checked ? 'left-7' : 'left-1')} />
      </span>
    </label>
  )
}
