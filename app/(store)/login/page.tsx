import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { safeNext } from '@/lib/utils'
import { LoginForm } from '@/components/login-form'
import { getSettings } from '@/lib/store'

export const metadata: Metadata = { title: 'Masuk', robots: { index: false } }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string }> }) {
  const sp = await searchParams
  const next = safeNext(sp.next)
  const user = await getCurrentUser()
  if (user) redirect(next)
  const initialTab = sp.mode === 'register' ? 'register' : 'login'
  const settings = await getSettings()
  return (
    <div className="page flex justify-center py-8 sm:py-14">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold">Masuk ke {settings?.store_name || 'Kedai Karuhun'}</h1>
        <p className="mb-6 mt-1 text-[15px] text-ink-muted">Gunakan nomor HP dan password. Tidak perlu email untuk masuk atau membuat akun.</p>
        <LoginForm next={next} initialTab={initialTab} />
        <p className="mt-6 flex items-start gap-2 rounded-xl bg-cream-100 p-3 text-[13px] text-ink-muted">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand-600" /> Data akun dan pesanan dilindungi oleh sistem autentikasi Kedai Karuhun. <Link href="/privacy" className="font-semibold underline">Privasi</Link>
        </p>
        <Link href="/" className="mt-4 flex min-h-[44px] items-center justify-center font-semibold text-brand-700">Lanjut lihat-lihat dulu →</Link>
      </div>
    </div>
  )
}
