'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Minus, PackagePlus, Pencil, Trash } from 'lucide-react'
import type { Product } from '@/types'
import { num, cn } from '@/lib/utils'
import { useToast } from '@/lib/toast'
import { Sheet } from '@/components/sheet'
import { Badge, Field, ProductImage, Spinner } from '@/components/ui'

type Mode = 'in' | 'adjust' | 'waste'
const MODES: Array<{ id: Mode; label: string; icon: typeof Minus; hint: string; amount: string }> = [
  { id: 'in', label: 'Stok masuk', icon: PackagePlus, hint: 'Barang baru datang / restok.', amount: 'Jumlah masuk' },
  { id: 'adjust', label: 'Koreksi', icon: Pencil, hint: 'Samakan dengan hasil hitung fisik.', amount: 'Stok sebenarnya' },
  { id: 'waste', label: 'Rusak/buang', icon: Trash, hint: 'Barang rusak, busuk, atau hilang.', amount: 'Jumlah dibuang' },
]

export function StockList({ products, focusId }: { products: Product[]; focusId?: string }) {
  const router = useRouter()
  const toast = useToast()
  const [active, setActive] = useState<Product | null>(null)
  const [mode, setMode] = useState<Mode>('in')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const open = (p: Product) => { setActive(p); setMode('in'); setAmount(''); setNote(''); setErr('') }
  useEffect(() => {
    if (focusId) {
      const p = products.find((x) => x.id === focusId)
      if (p) open(p)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId])

  const preview = (() => {
    if (!active || amount === '') return null
    const n = Number(amount)
    if (Number.isNaN(n)) return null
    return mode === 'in' ? active.stock_quantity + n : mode === 'waste' ? active.stock_quantity - n : n
  })()

  const submit = async () => {
    if (!active) return
    if (amount === '' || Number(amount) < 0) return setErr('Isi jumlah dengan benar.')
    if (mode !== 'in' && note.trim().length < 3) return setErr('Alasan wajib diisi.')
    if (preview !== null && preview < 0) return setErr('Stok tidak boleh kurang dari 0.')
    setBusy(true)
    setErr('')
    const res = await fetch('/api/admin/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: active.id, mode, amount: Number(amount), note: note.trim() || null }) })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok || json.ok === false) return setErr(json.error || 'Gagal menyimpan.')
    toast.success('Stok diperbarui', { description: `${active.name}: ${num(json.stock)} ${active.unit}` })
    setActive(null)
    router.refresh()
  }

  const m = MODES.find((x) => x.id === mode)!

  return (
    <>
      <ul className="space-y-3">
        {products.map((p) => {
          const out = p.stock_quantity <= 0
          const low = !out && p.stock_quantity <= p.low_stock_threshold
          return (
            <li key={p.id} className={cn('card flex items-center gap-3 p-3', focusId === p.id && 'ring-2 ring-brand-500')}>
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream-200"><ProductImage src={p.image_url} name={p.name} sizes="56px" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{p.name}</p>
                <p className="text-[13px] text-ink-muted">Batas menipis: {num(p.low_stock_threshold)}</p>
                <Badge tone={out ? 'bad' : low ? 'warn' : 'good'} className="mt-1">{out ? 'Habis' : `${num(p.stock_quantity)} ${p.unit}`}</Badge>
              </div>
              <button className="btn-soft" onClick={() => open(p)}>Atur stok</button>
            </li>
          )
        })}
      </ul>

      <Sheet open={!!active} onClose={() => setActive(null)} title={active?.name ?? ''} description={active ? `Stok sekarang: ${num(active.stock_quantity)} ${active.unit}` : ''}
        footer={<button className="btn-primary btn-lg w-full" onClick={submit} disabled={busy}>{busy ? <><Spinner /> Menyimpan...</> : 'Simpan perubahan stok'}</button>}>
        <div className="grid grid-cols-3 gap-2" role="tablist">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button key={id} role="tab" aria-selected={mode === id} onClick={() => { setMode(id); setErr('') }} className={cn('flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border text-[13px] font-bold', mode === id ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-line')}>
              <Icon size={20} /> {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[14px] text-ink-muted">{m.hint}</p>
        <div className="mt-3 space-y-4">
          <Field label={`${m.amount} (${active?.unit ?? ''})`} htmlFor="amt" required>
            <input id="amt" className="input text-xl font-bold" inputMode="decimal" autoFocus value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} />
          </Field>
          {preview !== null && <p className={cn('rounded-xl p-3 text-[15px] font-semibold', preview < 0 ? 'bg-red-50 text-red-800' : 'bg-brand-50 text-brand-800')}>Stok menjadi: {num(preview)} {active?.unit}</p>}
          <Field label={mode === 'in' ? 'Catatan (opsional)' : 'Alasan (wajib)'} htmlFor="nt">
            <input id="nt" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder={mode === 'in' ? 'Contoh: beli dari pasar' : mode === 'adjust' ? 'Contoh: hasil stok opname' : 'Contoh: busuk'} />
          </Field>
          {err && <p className="field-error" role="alert">{err}</p>}
        </div>
      </Sheet>
    </>
  )
}
