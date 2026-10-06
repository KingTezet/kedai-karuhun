'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Clock, Search, X } from 'lucide-react'
import { track } from '@/lib/analytics'

const KEY = 'kk-recent-search'

export function SearchBox({ initial, showRecent }: { initial: string; showRecent: boolean }) {
  const router = useRouter()
  const [q, setQ] = useState(initial)
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(KEY) || '[]'))
    } catch {}
  }, [])
  useEffect(() => {
    if (!initial) return
    track('search', { search_term: initial })
    try {
      const next = [initial, ...(JSON.parse(localStorage.getItem(KEY) || '[]') as string[]).filter((x) => x !== initial)].slice(0, 6)
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {}
  }, [initial])

  const go = (term: string) => {
    const t = term.trim()
    if (t) router.push(`/search?q=${encodeURIComponent(t)}`)
  }

  return (
    <div>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          go(q)
        }}
        className="relative"
      >
        <label htmlFor="q" className="sr-only">Cari produk</label>
        <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          id="q"
          autoFocus={!initial}
          enterKeyHint="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input min-h-[52px] pl-12 pr-12 text-[17px]"
          placeholder="Cari mangga, telur, minyak..."
        />
        {q && (
          <button type="button" onClick={() => setQ('')} aria-label="Hapus kata pencarian" className="absolute right-1.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl text-ink-muted hover:bg-cream-200">
            <X size={18} />
          </button>
        )}
      </form>
      {showRecent && recent.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-muted">Pencarian terakhir</h2>
            <button
              className="min-h-[40px] px-2 text-sm font-semibold text-brand-700"
              onClick={() => {
                localStorage.removeItem(KEY)
                setRecent([])
              }}
            >
              Hapus
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <button key={r} onClick={() => go(r)} className="chip">
                <Clock size={15} /> {r}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
