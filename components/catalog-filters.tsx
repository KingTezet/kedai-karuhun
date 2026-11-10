'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import type { Category } from '@/types'
import type { ProductQuery, SortKey } from '@/lib/store'
import { buildHref } from '@/lib/catalog-params'
import { Sheet } from '@/components/sheet'
import { cn } from '@/lib/utils'

const SORT_LABEL: Record<SortKey, string> = {
  relevan: 'Paling sesuai',
  terbaru: 'Terbaru',
  termurah: 'Harga termurah',
  termahal: 'Harga tertinggi',
}

export function CatalogFilters({
  base,
  query,
  categories,
  showCategories = true,
}: {
  base: string
  query: ProductQuery
  categories: Category[]
  showCategories?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [sort, setSort] = useState<SortKey>(query.sort ?? 'relevan')
  const [available, setAvailable] = useState(!!query.available)
  const [min, setMin] = useState(query.min ? String(query.min) : '')
  const [max, setMax] = useState(query.max ? String(query.max) : '')

  const activeCount = (query.available ? 1 : 0) + (query.min || query.max ? 1 : 0) + (query.sort && query.sort !== 'relevan' ? 1 : 0)

  const apply = () => {
    router.push(
      buildHref(base, query, {
        sort: sort !== 'relevan' ? sort : undefined,
        tersedia: available ? 1 : undefined,
        min: Number(min) > 0 ? Number(min) : undefined,
        max: Number(max) > 0 ? Number(max) : undefined,
        page: undefined,
      }),
    )
    setOpen(false)
  }
  const reset = () => {
    setSort('relevan')
    setAvailable(false)
    setMin('')
    setMax('')
  }

  const sortNow = query.sort ?? 'relevan'
  return (
    <div className="mb-4">
      {showCategories && (
        <div className="no-scrollbar -mx-4 mb-2.5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:hidden" role="list" aria-label="Kategori">
          <Link role="listitem" href={buildHref(base, query, { kategori: undefined, page: undefined })} className={cn('chip', !query.category && 'chip-active')}>
            Semua
          </Link>
          {categories.map((c) => (
            <Link
              role="listitem"
              key={c.id}
              href={buildHref(base, query, { kategori: c.slug, page: undefined })}
              className={cn('chip', query.category === c.slug && 'chip-active')}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 rounded-xl border border-line/70 bg-white px-3 py-2 shadow-card">
        <span className="hidden shrink-0 text-[13px] font-semibold text-ink-muted sm:inline">Urutkan:</span>
        <div className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
          {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
            <Link
              key={k}
              href={buildHref(base, query, { sort: k !== 'relevan' ? k : undefined, page: undefined })}
              aria-current={sortNow === k ? 'true' : undefined}
              className={cn('chip min-h-[32px] px-3 text-[12px]', sortNow === k && 'chip-active')}
            >
              {SORT_LABEL[k]}
            </Link>
          ))}
        </div>
        <button onClick={() => setOpen(true)} className={cn('chip min-h-[32px] shrink-0 px-3 text-[12px]', activeCount > 0 && 'chip-active')} aria-label="Buka filter dan urutan">
          <SlidersHorizontal size={15} />
          Filter{activeCount > 0 && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] text-white">{activeCount}</span>}
        </button>
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Filter & urutan"
        footer={
          <div className="flex gap-3">
            <button onClick={reset} className="btn-secondary flex-1">Atur ulang</button>
            <button onClick={apply} className="btn-primary flex-[2]">Tampilkan produk</button>
          </div>
        }
      >
        <fieldset>
          <legend className="label">Urutkan</legend>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSort(k)}
                aria-pressed={sort === k}
                className={cn('chip justify-center', sort === k && 'chip-active')}
              >
                {SORT_LABEL[k]}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="mt-5 flex min-h-[52px] cursor-pointer items-center justify-between rounded-xl border border-line px-4">
          <span className="font-semibold">Hanya yang tersedia</span>
          <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="h-6 w-6 accent-brand-600" />
        </label>

        <fieldset className="mt-5">
          <legend className="label">Rentang harga (Rp)</legend>
          <div className="grid grid-cols-2 gap-3">
            <input className="input" inputMode="numeric" placeholder="Terendah" aria-label="Harga terendah" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))} />
            <input className="input" inputMode="numeric" placeholder="Tertinggi" aria-label="Harga tertinggi" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} />
          </div>
        </fieldset>
      </Sheet>
    </div>
  )
}
