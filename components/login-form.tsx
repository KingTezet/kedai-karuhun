'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Eye, EyeOff, KeyRound, Phone, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/toast'
import { Field, Spinner } from '@/components/ui'
import { phoneAuthEmail, authPhone } from '@/lib/phone-auth'

function friendlyAuthError(message: string) {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Nomor HP atau password salah.'
  if (m.includes('user already registered') || m.includes('already registered')) return 'Nomor HP ini sudah terdaftar. Coba masuk.'
  if (m.includes('password should be at least')) return 'Password terlalu pendek. Gunakan minimal 8 karakter.'
  if (m.includes('rate limit') || m.includes('too many requests') || m.includes('too many')) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'
  if (m.includes('email provider') || m.includes('email sign-up')) return 'Pendaftaran sedang dinonaktifkan. Coba lagi beberapa saat.'
  return 'Terjadi masalah. Coba lagi beberapa saat.'
}

export function LoginForm({ next, initialTab = 'login' }: { next: string; initialTab?: 'login' | 'register' }) {
  const router = useRouter()
  const toast = useToast()
  const [mode, setMode] = useState<'login' | 'register'>(initialTab)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')

    let normalized = ''
    let internalEmail = ''
    try {
      normalized = authPhone(phone)
      internalEmail = phoneAuthEmail(phone)
    } catch {
      return setError('Nomor HP belum benar. Contoh: 0812 3456 7890')
    }

    if (!/^\+628\d{8,12}$/.test(normalized)) return setError('Nomor HP belum benar. Contoh: 0812 3456 7890')
    if (password.length < 8) return setError('Password minimal 8 karakter.')
    if (mode === 'register') {
      if (fullName.trim().length < 2) return setError('Nama lengkap wajib diisi.')
      if (password !== confirmPassword) return setError('Konfirmasi password tidak sama.')
    }

    setBusy(true)
    const supabase = createClient()

    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email: internalEmail, password })
      setBusy(false)
      if (err) return setError(friendlyAuthError(err.message))
      toast.success('Berhasil masuk', { description: 'Selamat datang kembali.' })
      router.replace(next)
      router.refresh()
      return
    }

    const { data, error: err } = await supabase.auth.signUp({
      email: internalEmail,
      password,
      options: { data: { full_name: fullName.trim(), phone: normalized } },
    })
    setBusy(false)
    if (err) return setError(friendlyAuthError(err.message))

    if (data.session) {
      toast.success('Akun berhasil dibuat')
      router.replace(next)
      router.refresh()
      return
    }

    setNotice('Akun berhasil dibuat. Masuk lagi dengan nomor HP dan password kamu.')
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-cream-100 p-1">
        <button type="button" className={mode === 'login' ? 'min-h-[44px] rounded-lg bg-white px-3 font-bold text-ink shadow-sm' : 'min-h-[44px] rounded-lg px-3 font-semibold text-ink-muted'} onClick={() => { setMode('login'); setError(''); setNotice('') }}>Masuk</button>
        <button type="button" className={mode === 'register' ? 'min-h-[44px] rounded-lg bg-white px-3 font-bold text-ink shadow-sm' : 'min-h-[44px] rounded-lg px-3 font-semibold text-ink-muted'} onClick={() => { setMode('register'); setError(''); setNotice('') }}>Daftar</button>
      </div>

      <form className="space-y-4" onSubmit={submit} noValidate>
        {mode === 'register' && (
          <Field label="Nama lengkap" htmlFor="full-name" required>
            <input id="full-name" className="input min-h-[50px]" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama kamu" />
          </Field>
        )}

        <Field label="Nomor HP" htmlFor="phone" required hint="Contoh: 0812 3456 7890">
          <div className="relative">
            <Phone size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input id="phone" type="tel" className="input min-h-[50px] pl-12" autoComplete="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812 3456 7890" />
          </div>
        </Field>

        <Field label="Password" htmlFor="password" required hint="Minimal 8 karakter.">
          <div className="relative">
            <KeyRound size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input id="password" type={showPassword ? 'text' : 'password'} className="input min-h-[50px] pl-12 pr-12" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-ink-muted hover:bg-cream-100" aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}>
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
        </Field>

        {mode === 'register' && (
          <Field label="Ulangi password" htmlFor="confirm-password" required>
            <div className="relative">
              <input id="confirm-password" type={showConfirm ? 'text' : 'password'} className="input min-h-[50px] pr-12" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-ink-muted hover:bg-cream-100" aria-label={showConfirm ? 'Sembunyikan password' : 'Lihat password'}>
                {showConfirm ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </Field>
        )}

        {error && <p className="field-error" role="alert">{error}</p>}
        {notice && <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-[14px] font-semibold text-brand-900" role="status">{notice}</div>}

        <button className="btn-primary btn-lg w-full" disabled={busy}>
          {busy ? <><Spinner /> Memproses...</> : mode === 'login' ? 'Masuk ke akun' : <><UserPlus size={18} /> Buat akun</>}
        </button>
      </form>

      {mode === 'login' && (
        <p className="mt-4 rounded-xl bg-cream-100 p-3 text-center text-[13px] leading-relaxed text-ink-muted">
          Lupa password? Hubungi toko lewat WhatsApp agar admin bisa membantu mengatur ulang password.
        </p>
      )}

      <p className="mt-5 text-center text-[13px] leading-relaxed text-ink-muted">
        Kamu cukup login satu kali di perangkat ini. Sesi akan tetap tersimpan sampai kamu memilih keluar.
      </p>
    </div>
  )
}
