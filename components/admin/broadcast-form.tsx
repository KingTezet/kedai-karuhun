'use client'

import { useState } from 'react'
import { Link2, Megaphone, Send, Sparkles } from 'lucide-react'
import { Field, Spinner } from '@/components/ui'
import { Panel } from '@/components/admin/ui'
import { useToast } from '@/lib/toast'

const TYPES = [
  ['announcement', 'Info toko'],
  ['new_product', 'Produk baru'],
  ['promotion', 'Promo / diskon'],
  ['stock', 'Stok tersedia'],
  ['other', 'Lainnya'],
] as const

export function BroadcastForm() {
  const toast = useToast()
  const [type, setType] = useState<(typeof TYPES)[number][0]>('announcement')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [href, setHref] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ recipients: number; pushSubscriptions: number; pushSent: number; pushFailed: number; pushConfigured: boolean; pushDiagnostic?: string } | null>(null)

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/broadcasts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title, body, href }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.ok) throw new Error(json.error || 'Broadcast gagal dikirim.')
      setResult({ recipients: json.recipients, pushSubscriptions: json.pushSubscriptions ?? 0, pushSent: json.pushSent, pushFailed: json.pushFailed, pushConfigured: !!json.pushConfigured, pushDiagnostic: json.pushDiagnostic })
      toast.success('Broadcast berhasil dikirim')
      setTitle(''); setBody(''); setHref('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Broadcast gagal dikirim.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel title="Buat broadcast" action={<span className="badge bg-brand-50 text-brand-700"><Megaphone size={14} /> Semua pelanggan</span>}>
      <form onSubmit={send} className="space-y-5">
        <div className="grid gap-2 sm:grid-cols-5">
          {TYPES.map(([value, label]) => (
            <button type="button" key={value} onClick={() => setType(value)} className={`min-h-[48px] rounded-xl border px-3 text-sm font-bold transition ${type === value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line bg-white text-ink-soft hover:bg-cream-100'}`}>
              {label}
            </button>
          ))}
        </div>
        <Field label="Judul notifikasi" htmlFor="broadcast-title" required hint="Maksimal 90 karakter.">
          <input id="broadcast-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={90} placeholder="🔥 Diskon hari ini!" required />
        </Field>
        <Field label="Isi notifikasi" htmlFor="broadcast-body" required hint="Maksimal 360 karakter. Buat singkat dan jelas agar enak dibaca sebagai push notification.">
          <textarea id="broadcast-body" className="input min-h-[120px]" value={body} onChange={(e) => setBody(e.target.value)} maxLength={360} placeholder="Jagung manis sedang diskon 20% sampai malam ini. Yuk belanja sekarang." required />
        </Field>
        <Field label="Tautan saat notifikasi dibuka" htmlFor="broadcast-href" hint="Opsional. Gunakan path internal, misalnya /products/jagung-manis atau /promo. Tanpa tautan pun tetap bisa dikirim.">
          <div className="relative"><Link2 size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" /><input id="broadcast-href" className="input pl-10" value={href} onChange={(e) => setHref(e.target.value)} placeholder="/products" /></div>
        </Field>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-cream-50 p-4">
            <div className="flex items-center gap-2 font-bold"><Sparkles size={18} className="text-brand-600" /> Preview</div>
            <div className="mt-3 rounded-2xl border border-line bg-white p-4 shadow-card">
              <p className="font-extrabold">{title || 'Judul notifikasi'}</p>
              <p className="mt-1 text-sm text-ink-muted">{body || 'Isi notifikasi akan tampil di sini.'}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-cream-50 p-4 text-sm text-ink-muted">
            <p className="font-bold text-ink">Yang akan dikirim</p>
            <p className="mt-2">1. Riwayat notifikasi masuk ke akun pelanggan.</p>
            <p className="mt-1">2. Push dikirim ke semua perangkat pelanggan yang sudah mengaktifkan notifikasi.</p>
            <p className="mt-1">3. Kalau pelanggan belum mengaktifkan push, mereka tetap bisa melihat broadcast di halaman Akun.</p>
          </div>
        </div>

        {result && (
          <div className={`rounded-2xl border p-4 text-sm ${result.pushConfigured && result.pushSent > 0 ? 'border-green-300 bg-green-50 text-green-900' : 'border-amber-300 bg-amber-50 text-amber-950'}`}>
            <b>Broadcast tersimpan.</b> {result.recipients} pelanggan menerima notifikasi di inbox.
            {' '}Ditemukan {result.pushSubscriptions} device push, berhasil dikirim ke {result.pushSent} device{result.pushFailed ? `, ${result.pushFailed} gagal` : ''}.
            {result.pushDiagnostic && <p className="mt-2 font-semibold">{result.pushDiagnostic}</p>}
          </div>
        )}
        <button className="btn-primary btn-lg w-full sm:w-auto" disabled={busy || title.trim().length < 2 || body.trim().length < 2}>
          {busy ? <><Spinner /> Mengirim...</> : <><Send size={18} /> Kirim broadcast sekarang</>}
        </button>
      </form>
    </Panel>
  )
}
