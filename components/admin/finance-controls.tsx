'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Sheet } from '@/components/sheet'
import { Field, Spinner } from '@/components/ui'

const CATS = ['Belanja stok', 'Gaji', 'Listrik & air', 'Transport', 'Plastik & kemasan', 'Sewa', 'Lainnya']

export function AddTransaction({ today }: { today: string }) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [category, setCategory] = useState('Belanja stok')
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState(today)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    if (!amount || Number(amount) <= 0) return setErr('Isi nominal dengan benar.')
    setBusy(true)
    setErr('')
    const res = await fetch('/api/admin/finance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, category: category.trim(), amount_idr: Number(amount), description: desc.trim() || null, occurred_at: date }) })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok || json.ok === false) return setErr(json.error || 'Gagal menyimpan.')
    toast.success(type === 'expense' ? 'Pengeluaran dicatat' : 'Pemasukan dicatat')
    setOpen(false)
    setAmount('')
    setDesc('')
    router.refresh()
  }

  return (
    <>
      <button className="btn-primary" onClick={() => { setErr(''); setOpen(true) }}><Plus size={18} /> Catat transaksi</button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Catat transaksi" footer={<button className="btn-primary btn-lg w-full" onClick={save} disabled={busy}>{busy ? <><Spinner /> Menyimpan...</> : 'Simpan'}</button>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2" role="tablist">
            {(['expense', 'income'] as const).map((t) => (
              <button key={t} role="tab" aria-selected={type === t} onClick={() => setType(t)} className={cn('btn h-12', type === t ? (t === 'expense' ? 'bg-red-600 text-white' : 'bg-brand-600 text-white') : 'border border-line bg-white')}>
                {t === 'expense' ? 'Pengeluaran' : 'Pemasukan lain'}
              </button>
            ))}
          </div>
          <Field label="Nominal (Rp)" htmlFor="am" required><input id="am" className="input text-xl font-bold" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} placeholder="50000" /></Field>
          <Field label="Kategori" htmlFor="ct" required>
            <input id="ct" list="fin-cats" className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
            <datalist id="fin-cats">{CATS.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Tanggal" htmlFor="dt"><input id="dt" type="date" className="input" value={date} max={today} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Catatan (opsional)" htmlFor="ds"><input id="ds" className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Contoh: beli sayur di pasar" /></Field>
          {err && <p className="field-error" role="alert">{err}</p>}
        </div>
      </Sheet>
    </>
  )
}

export function DeleteTransaction({ id }: { id: string }) {
  const router = useRouter()
  const toast = useToast()
  return (
    <button
      aria-label="Hapus transaksi"
      className="grid h-10 w-10 place-items-center rounded-lg text-red-600 hover:bg-red-50"
      onClick={async () => {
        if (!confirm('Hapus transaksi ini?')) return
        const res = await fetch('/api/admin/finance', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json.ok === false) return toast.error(json.error || 'Gagal menghapus.')
        toast.info('Transaksi dihapus')
        router.refresh()
      }}
    >
      <Trash2 size={17} />
    </button>
  )
}

export function RangeLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <Link href={href} className={cn('chip', active && 'chip-active')}>{children}</Link>
}
