'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Eye, EyeOff, Phone, UserPlus } from 'lucide-react'
import { useToast } from '@/lib/toast'
import { Field, Spinner } from '@/components/ui'
import type { Role } from '@/types'
import { ROLE_LABEL } from '@/lib/status'
import { Sheet } from '@/components/sheet'

async function createUser(body: unknown) {
  const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok && json.ok !== false, error: (json.error as string) || 'Gagal membuat akun.' }
}

export function CreateUserForm({ canCreateStaff }: { canCreateStaff: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('customer')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const reset = () => { setPhone(''); setName(''); setPassword(''); setRole('customer'); setShow(false); setError('') }

  const submit = async () => {
    setError('')
    if (!/^0\d{8,13}$/.test(phone.replace(/\D/g, '').replace(/^62/, '0'))) return setError('Nomor HP belum benar. Contoh: 0812 3456 7890')
    if (name.trim().length < 2) return setError('Nama lengkap wajib diisi.')
    if (password.length < 8) return setError('Password minimal 8 karakter.')
    setBusy(true)
    const r = await createUser({ phone: phone.trim(), password, full_name: name.trim(), role })
    setBusy(false)
    if (!r.ok) return setError(r.error)
    toast.success('Akun berhasil dibuat', { description: `${name.trim()} · ${ROLE_LABEL[role]}` })
    setOpen(false)
    reset()
    router.refresh()
  }

  return (
    <>
      <button className="btn-primary" onClick={() => { reset(); setOpen(true) }}><UserPlus size={18} /> Tambah pengguna</button>
      <Sheet open={open} onClose={() => !busy && setOpen(false)} title="Tambah pengguna" description="Buat akun siap pakai dengan nomor HP dan password, tanpa email.">
        <div className="space-y-4">
          <Field label="Nama lengkap" htmlFor="new-user-name" required><input id="new-user-name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama pelanggan" /></Field>
          <Field label="Nomor HP" htmlFor="new-user-phone" required hint="Nomor ini dipakai untuk login. Contoh: 0812 3456 7890">
            <div className="relative"><Phone size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" /><input id="new-user-phone" className="input pl-10" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812 3456 7890" /></div>
          </Field>
          <Field label="Password awal" htmlFor="new-user-password" required hint="Berikan password ini ke pengguna. Sarankan menggantinya setelah login.">
            <div className="relative"><input id="new-user-password" className="input pr-12" type={show ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-ink-muted" aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}>{show ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>
          </Field>
          {canCreateStaff && (
            <Field label="Peran" htmlFor="new-user-role"><select id="new-user-role" className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>{(['customer','staff','manager','admin'] as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></Field>
          )}
          {!canCreateStaff && <input type="hidden" value="customer" readOnly />}
          {error && <p className="field-error" role="alert">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setOpen(false)} disabled={busy}>Batal</button>
            <button type="button" className="btn-primary flex-1" onClick={submit} disabled={busy}>{busy ? <><Spinner /> Membuat...</> : 'Buat akun'}</button>
          </div>
        </div>
      </Sheet>
    </>
  )
}
