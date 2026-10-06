'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import type { Address, DeliveryZone } from '@/types'
import { useToast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Sheet } from '@/components/sheet'
import { Field, Spinner } from '@/components/ui'

async function call(url: string, method: string, body: unknown) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok && json.ok !== false, error: (json.error as string) || 'Terjadi kesalahan. Coba lagi.' }
}

export function ProfileForm({ initial }: { initial: { full_name: string; phone: string } }) {
  const router = useRouter()
  const toast = useToast()
  const [f, setF] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const dirty = f.full_name !== initial.full_name || f.phone !== initial.phone

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setErr('')
        const r = await call('/api/account', 'PUT', f)
        setBusy(false)
        if (!r.ok) return setErr(r.error)
        toast.success('Data diri tersimpan')
        router.refresh()
      }}
    >
      <Field label="Nama lengkap" htmlFor="fn" required>
        <input id="fn" className="input" autoComplete="name" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
      </Field>
      <Field label="Nomor HP / WhatsApp" htmlFor="hp" required error={err}>
        <input id="hp" className="input" inputMode="tel" autoComplete="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="0812 3456 7890" />
      </Field>
      <button className="btn-primary w-full sm:w-auto" disabled={busy || !dirty}>{busy ? <><Spinner /> Menyimpan...</> : 'Simpan perubahan'}</button>
    </form>
  )
}

type Draft = { id?: string; label: string; recipient_name: string; phone: string; address_line: string; notes: string; zone_id: string; is_default: boolean }

export function AddressManager({ addresses, zones, defaults }: { addresses: Address[]; zones: DeliveryZone[]; defaults: { name: string; phone: string } }) {
  const router = useRouter()
  const toast = useToast()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [del, setDel] = useState<Address | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const blank = (): Draft => ({ label: 'Rumah', recipient_name: defaults.name, phone: defaults.phone, address_line: '', notes: '', zone_id: '', is_default: addresses.length === 0 })
  const edit = (a: Address): Draft => ({ id: a.id, label: a.label, recipient_name: a.recipient_name, phone: a.phone, address_line: a.address_line, notes: a.notes ?? '', zone_id: a.zone_id ?? '', is_default: a.is_default })

  const save = async () => {
    if (!draft) return
    setBusy(true)
    setErr('')
    const body = { ...draft, notes: draft.notes || null, zone_id: draft.zone_id || null }
    const r = await call('/api/account/addresses', draft.id ? 'PUT' : 'POST', body)
    setBusy(false)
    if (!r.ok) return setErr(r.error)
    toast.success(draft.id ? 'Alamat diperbarui' : 'Alamat disimpan')
    setDraft(null)
    router.refresh()
  }

  return (
    <div>
      {addresses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-6 text-center">
          <MapPin className="mx-auto text-brand-600" size={28} />
          <p className="mt-2 font-bold">Belum ada alamat tersimpan</p>
          <p className="text-[14px] text-ink-muted">Simpan alamat supaya checkout berikutnya lebih cepat.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map((a) => (
            <li key={a.id} className={cn('rounded-2xl border p-4', a.is_default ? 'border-brand-300 bg-brand-50' : 'border-line bg-white')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold">{a.label} {a.is_default && <span className="badge ml-1 bg-brand-600 text-white">Utama</span>}</p>
                  <p className="text-[14px] text-ink-muted">{a.recipient_name} · {a.phone}</p>
                  <p className="mt-1 text-[15px]">{a.address_line}</p>
                  {a.notes && <p className="text-[13px] text-ink-muted">Patokan: {a.notes}</p>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn-secondary btn-sm" onClick={() => { setErr(''); setDraft(edit(a)) }}><Pencil size={15} /> Ubah</button>
                {!a.is_default && (
                  <button
                    className="btn-secondary btn-sm"
                    onClick={async () => {
                      const r = await call('/api/account/addresses', 'PUT', { ...edit(a), notes: a.notes, zone_id: a.zone_id, is_default: true })
                      if (r.ok) { toast.success('Dijadikan alamat utama'); router.refresh() } else toast.error(r.error)
                    }}
                  >
                    <Star size={15} /> Jadikan utama
                  </button>
                )}
                <button className="btn-danger-soft btn-sm" onClick={() => setDel(a)}><Trash2 size={15} /> Hapus</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <button className="btn-soft mt-3 w-full" onClick={() => { setErr(''); setDraft(blank()) }}><Plus size={18} /> Tambah alamat</button>

      <Sheet
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Ubah alamat' : 'Tambah alamat'}
        footer={<button onClick={save} disabled={busy} className="btn-primary btn-lg w-full">{busy ? <><Spinner /> Menyimpan...</> : 'Simpan alamat'}</button>}
      >
        {draft && (
          <div className="space-y-4">
            <div>
              <p className="label">Label</p>
              <div className="flex gap-2">
                {['Rumah', 'Kantor', 'Lainnya'].map((l) => (
                  <button key={l} type="button" onClick={() => setDraft({ ...draft, label: l })} className={cn('chip', draft.label === l && 'chip-active')}>{l}</button>
                ))}
              </div>
            </div>
            <Field label="Nama penerima" htmlFor="a-n" required><input id="a-n" className="input" value={draft.recipient_name} onChange={(e) => setDraft({ ...draft, recipient_name: e.target.value })} /></Field>
            <Field label="Nomor HP" htmlFor="a-p" required><input id="a-p" className="input" inputMode="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></Field>
            <Field label="Alamat lengkap" htmlFor="a-a" required><textarea id="a-a" className="input" value={draft.address_line} onChange={(e) => setDraft({ ...draft, address_line: e.target.value })} placeholder="Nama jalan, RT/RW, nomor rumah" /></Field>
            <Field label="Patokan (opsional)" htmlFor="a-pt"><input id="a-pt" className="input" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Dekat warung biru" /></Field>
            {zones.length > 0 && (
              <Field label="Area pengantaran" htmlFor="a-z" hint="Membantu memilih ongkir otomatis di checkout.">
                <select id="a-z" className="input" value={draft.zone_id} onChange={(e) => setDraft({ ...draft, zone_id: e.target.value })}>
                  <option value="">Pilih nanti saat checkout</option>
                  {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </Field>
            )}
            <label className="flex min-h-[44px] items-center gap-3 font-semibold">
              <input type="checkbox" className="h-5 w-5 accent-[#2F7D3A]" checked={draft.is_default} onChange={(e) => setDraft({ ...draft, is_default: e.target.checked })} /> Jadikan alamat utama
            </label>
            {err && <p className="field-error" role="alert">{err}</p>}
          </div>
        )}
      </Sheet>

      <Sheet
        open={!!del}
        onClose={() => setDel(null)}
        title="Hapus alamat?"
        footer={
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setDel(null)}>Batal</button>
            <button
              className="btn-danger flex-1"
              onClick={async () => {
                if (!del) return
                const r = await call('/api/account/addresses', 'DELETE', { id: del.id })
                setDel(null)
                if (r.ok) { toast.info('Alamat dihapus'); router.refresh() } else toast.error(r.error)
              }}
            >
              Ya, hapus
            </button>
          </div>
        }
      >
        <p className="text-[15px]">{del?.label}: {del?.address_line}</p>
      </Sheet>
    </div>
  )
}

export function PasswordForm() {
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [show, setShow] = useState(false)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    if (password.length < 8) return setErr('Password minimal 8 karakter.')
    if (password !== confirm) return setErr('Konfirmasi password tidak sama.')
    setBusy(true)
    const { createClient } = await import('@/lib/supabase/client')
    const { error } = await createClient().auth.updateUser({ password })
    setBusy(false)
    if (error) return setErr('Password belum berhasil disimpan. Coba lagi.')
    setPassword('')
    setConfirm('')
    toast.success('Password berhasil diperbarui')
  }

  return (
    <form className="space-y-4" onSubmit={save}>
      <Field label="Password baru" htmlFor="account-password" hint="Minimal 8 karakter. Password dipakai bersama nomor HP untuk login.">
        <div className="relative">
          <input id="account-password" className="input pr-12" type={show ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-ink-muted" aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}>{show ? '🙈' : '👁'}</button>
        </div>
      </Field>
      <Field label="Ulangi password" htmlFor="account-password-confirm">
        <input id="account-password-confirm" className="input" type={show ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      {err && <p className="field-error" role="alert">{err}</p>}
      <button className="btn-primary" disabled={busy}>{busy ? <><Spinner /> Menyimpan...</> : 'Simpan password'}</button>
    </form>
  )
}
