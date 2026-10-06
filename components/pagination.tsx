import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (p: number) => string }) {
  if (pages <= 1) return null
  const cell = 'btn-secondary btn-sm min-w-[44px]'
  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Halaman">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cell} aria-label="Halaman sebelumnya">
          <ChevronLeft size={18} /> Sebelumnya
        </Link>
      ) : (
        <span className={cn(cell, 'pointer-events-none opacity-40')}><ChevronLeft size={18} /> Sebelumnya</span>
      )}
      <span className="px-2 text-sm font-semibold text-ink-muted">
        {page} / {pages}
      </span>
      {page < pages ? (
        <Link href={hrefFor(page + 1)} className={cell} aria-label="Halaman berikutnya">
          Berikutnya <ChevronRight size={18} />
        </Link>
      ) : (
        <span className={cn(cell, 'pointer-events-none opacity-40')}>Berikutnya <ChevronRight size={18} /></span>
      )}
    </nav>
  )
}
