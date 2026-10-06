'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Category } from '@/types'
import { slugify, cn } from '@/lib/utils'
import { useToast } from '@/lib/toast'
import { Sheet } from '@/components/sheet'
import { Badge, Field, Spinner } from '@/components/ui'
import { categoryIcon, categoryTint, CATEGORY_ICON_OPTIONS } from '@/components/category-icon'
import { ImageUpload } from '@/components/admin/image-upload'

type Draft = { id?: string; name: string; slug: string; description: string; sort_order: string; is_active: boolean; image_url: string | null; icon_name: string | null }

async function call(method: string, body: unknown) {
  const res = await fetch('/api/admin/categories', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok && json.ok !== false, error: (json.error as string) || 'Terjadi kesalahan.' }
}

export function CategoryManager({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const router = useRouter()
  const toast = useToast()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [del, setDel] = useState<Category | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [touched, setTouched] = useState(false)

  const openNew = () => { setErr(''); setTouched(false); setDraft({ name: '', slug: '', description: '', sort_order: String((categories.at(-1)?.sort_order ?? 0) + 1), is_active: true, image_url: null, icon_name: 'shopping-basket' }) }
  const openEdit = (c: Category) => { setErr(''); setTouched(true); setDraft({ id: c.id, name: c.name, slug: c.slug, description: c.description ?? '', sort_order: String(c.sort_order), is_active: c.is_active, image_url: c.image_url ?? null, icon_name: c.icon_name ?? null }) }

  const save = async () => {
    if (!draft) return
    setBusy(true)
    setErr('')
    const r = await call(draft.id ? 'PATCH' : 'POST', { ...(draft.id ? { id: draft.id } : {}), name: draft.name.trim(), slug: draft.slug.trim(), description: draft.description.trim() || null, sort_order: Number(draft.sort_order || 0), is_active: draft.is_active, image_url: draft.image_url, icon_name: draft.icon_name })
    setBusy(false)
    if (!r.ok) return setErr(r.error)
    toast.success(draft.id ? 'Kategori diperbarui' : 'Kategori ditambahkan')
    setDraft(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] text-ink-muted">{categories.length} kategori</p>
        <button className="btn-primary" onClick={openNew}><Plus size={18} /> Tambah kategori</button>
      </div>

      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
        <b>Foto atau ikon custom:</b> upload foto kategori untuk menampilkannya sebagai foto. Kalau foto dihapus, ikon custom yang dipilih akan tampil.
      </div>

      <ul className="space-y-3">
        {categories.map((c, i) => {
          const Icon = categoryIcon(c.slug, c.name, c.icon_name)
          return (
            <li key={c.id} className={cn('card flex items-center gap-3 p-3', !c.is_active && 'opacity-70')}>
              {c.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image_url} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-xl', categoryTint(i))}><Icon size={24} /></span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{c.name}</p>
                <p className="text-[13px] text-ink-muted">{counts[c.id] ?? 0} produk · urutan {c.sort_order} {!c.is_active && <Badge className="ml-1">Nonaktif</Badge>}</p>
              </div>
              <button className="grid h-11 w-11 place-items-center rounded-xl text-ink-soft hover:bg-cream-200" aria-label={`Ubah ${c.name}`} onClick={() => openEdit(c)}><Pencil size={19} /></button>
              <button className="grid h-11 w-11 place-items-center rounded-xl text-ink-soft hover:bg-cream-200" aria-label={c.is_active ? `Nonaktifkan ${c.name}` : `Aktifkan ${c.name}`} onClick={async () => { const r = await call('PATCH', { id: c.id, is_active: !c.is_active }); if (r.ok) { toast.success(c.is_active ? 'Kategori disembunyikan' : 'Kategori aktif'); router.refresh() } else toast.error(r.error) }}>{c.is_active ? <Eye size={19} /> : <EyeOff size={19} />}</button>
              <button className="grid h-11 w-11 place-items-center rounded-xl text-red-600 hover:bg-red-50" aria-label={`Hapus ${c.name}`} onClick={() => setDel(c)}><Trash2 size={19} /></button>
            </li>
          )
        })}
      </ul>

      <Sheet open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Ubah kategori' : 'Tambah kategori'}
        footer={<button className="btn-primary btn-lg w-full" onClick={save} disabled={busy}>{busy ? <><Spinner /> Menyimpan...</> : 'Simpan'}</button>}>
        {draft && (
          <div className="space-y-4">
            <ImageUpload value={draft.image_url} onChange={(u) => setDraft({ ...draft, image_url: u })} bucket="product-images" label="Foto kategori (opsional)" aspect="aspect-[4/3]" />

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3"><p className="label mb-0">Ikon kategori</p><button type="button" className="text-xs font-bold text-ink-muted hover:text-brand-700" onClick={() => setDraft({ ...draft, icon_name: null })}>Otomatis</button></div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {CATEGORY_ICON_OPTIONS.map(([id, label, Icon]) => {
                  const active = draft.icon_name === id
                  return (
                    <button key={id} type="button" title={label} aria-label={`Pilih ikon ${label}`} onClick={() => setDraft({ ...draft, icon_name: id })} className={cn('flex min-h-[70px] flex-col items-center justify-center gap-1.5 rounded-xl border p-2 text-[11px] font-semibold transition', active ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-200' : 'border-line bg-white text-ink-muted hover:bg-cream-50')}>
                      <Icon size={22} />
                      <span className="truncate max-w-full">{label}</span>
                    </button>
                  )
                })}
              </div>
              {draft.image_url && <p className="mt-2 rounded-xl bg-amber-50 p-3 text-[13px] text-amber-900">Foto sedang dipakai di toko. Ikon ini akan tampil lagi setelah foto kategori dihapus.</p>}
              {draft.icon_name === null && <p className="mt-2 text-[13px] text-ink-muted">Mode otomatis memakai ikon berdasarkan nama kategori.</p>}
            </div>

            <Field label="Nama kategori" htmlFor="cn" required><input id="cn" className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: touched ? draft.slug : slugify(e.target.value) })} placeholder="Contoh: Sayur" /></Field>
            <Field label="Slug" htmlFor="cs" hint="Dipakai di link, huruf kecil tanpa spasi."><input id="cs" className="input" value={draft.slug} onChange={(e) => { setTouched(true); setDraft({ ...draft, slug: slugify(e.target.value) }) }} /></Field>
            <Field label="Deskripsi (opsional)" htmlFor="cd"><input id="cd" className="input" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
            <Field label="Urutan tampil" htmlFor="co" hint="Angka kecil tampil lebih dulu."><input id="co" className="input" inputMode="numeric" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: e.target.value.replace(/\D/g, '') })} /></Field>
            <label className="flex min-h-[48px] items-center gap-3 font-semibold"><input type="checkbox" className="h-5 w-5 accent-brand-600" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} /> Aktif (tampil di toko)</label>
            {err && <p className="field-error" role="alert">{err}</p>}
          </div>
        )}
      </Sheet>

      <Sheet open={!!del} onClose={() => setDel(null)} title="Hapus kategori?" description="Kategori yang masih punya produk tidak bisa dihapus."
        footer={<div className="flex gap-3"><button className="btn-secondary flex-1" onClick={() => setDel(null)}>Batal</button><button className="btn-danger flex-1" onClick={async () => { if (!del) return; const r = await call('DELETE', { id: del.id }); setDel(null); if (r.ok) { toast.success('Kategori dihapus'); router.refresh() } else toast.error(r.error) }}>Ya, hapus</button></div>}>
        <p className="font-semibold">{del?.name}</p>
      </Sheet>
    </div>
  )
}
