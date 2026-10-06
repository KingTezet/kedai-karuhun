'use client'

import { TriangleAlert } from 'lucide-react'

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-amber-700"><TriangleAlert size={30} /></span>
      <h2 className="mt-4 text-xl font-extrabold">Halaman gagal dimuat</h2>
      <p className="mt-1 text-ink-muted">Periksa koneksi lalu coba lagi.</p>
      <button onClick={reset} className="btn-primary mt-5">Coba lagi</button>
    </div>
  )
}
