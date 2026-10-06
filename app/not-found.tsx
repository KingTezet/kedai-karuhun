import Link from 'next/link'
import { SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-cream-100 px-6 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-100 text-brand-600"><SearchX size={36} /></span>
      <h1 className="mt-5 text-2xl font-extrabold">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-sm text-ink-muted">Mungkin produk atau halaman itu sudah dipindahkan atau tidak dijual lagi.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary btn-lg">Ke beranda</Link>
        <Link href="/products" className="btn-secondary btn-lg">Lihat produk</Link>
      </div>
    </div>
  )
}
