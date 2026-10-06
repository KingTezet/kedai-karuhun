'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/toast'
import { Field, Spinner } from '@/components/ui'

export function ResetPasswordForm() {
  const router = useRouter()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [show2, setShow2] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('Password minimal 8 karakter.')
    if (password !== confirm) return setError('Konfirmasi password tidak sama.')
    setBusy(true)
    const { error: err } = await createClient().auth.updateUser({ password })
    setBusy(false)
    if (err) return setError('Sesi pemulihan password tidak ditemukan atau link sudah kedaluwarsa. Untuk akun baru yang memakai nomor HP, hubungi toko agar admin membantu mengatur password baru.')
    toast.success('Password berhasil diubah')
    router.replace('/account')
    router.refresh()
  }

  return (
    <form className="space-y-4" onSubmit={save}>
      <Field label="Password baru" htmlFor="new-password" required>
        <div className="relative">
          <input id="new-password" className="input pr-12" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          <button type="button" className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-ink-muted" onClick={() => setShow((v) => !v)} aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}>{show ? <EyeOff size={19} /> : <Eye size={19} />}</button>
        </div>
      </Field>
      <Field label="Ulangi password" htmlFor="confirm-password" required>
        <div className="relative">
          <input id="confirm-password" className="input pr-12" type={show2 ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          <button type="button" className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-ink-muted" onClick={() => setShow2((v) => !v)} aria-label={show2 ? 'Sembunyikan password' : 'Tampilkan password'}>{show2 ? <EyeOff size={19} /> : <Eye size={19} />}</button>
        </div>
      </Field>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button className="btn-primary btn-lg w-full" disabled={busy}>{busy ? <><Spinner /> Menyimpan...</> : 'Simpan password'}</button>
    </form>
  )
}
