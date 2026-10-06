import type { Metadata } from 'next'
import Link from 'next/link'
import { ResetPasswordForm } from '@/components/reset-password-form'

export const metadata: Metadata = { title: 'Ganti password', robots: { index: false } }

export default function ResetPasswordPage() {
  return (
    <div className="page flex justify-center py-8 sm:py-14">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold">Buat password baru</h1>
        <p className="mb-6 mt-1 text-[15px] text-ink-muted">Kedai Karuhun sekarang menggunakan nomor HP untuk login. Halaman ini dipertahankan untuk tautan pemulihan akun lama.</p>
        <ResetPasswordForm />
        <Link href="/login" className="mt-5 flex min-h-[44px] items-center justify-center font-semibold text-brand-700">Kembali ke login</Link>
      </div>
    </div>
  )
}
