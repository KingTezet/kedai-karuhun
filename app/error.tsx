'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-cream-100 px-6 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-full bg-amber-100 text-amber-700"><TriangleAlert size={36} /></span>
      <h1 className="mt-5 text-2xl font-extrabold">Ada yang tidak beres</h1>
      <p className="mt-2 max-w-sm text-ink-muted">Maaf, halaman gagal dimuat. Coba lagi, atau kembali ke beranda.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="btn-primary btn-lg">Coba lagi</button>
        <Link href="/" className="btn-secondary btn-lg">Ke beranda</Link>
      </div>
    </div>
  )
}
