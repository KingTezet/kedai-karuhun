import Link from 'next/link'
import type { Category } from '@/types'
import { categoryIcon } from '@/components/category-icon'
import { cn } from '@/lib/utils'

/** Daftar kategori di kolom kiri halaman katalog (desktop). */
export function CatalogSidebar({ categories, active }: { categories: Category[]; active?: string }) {
  return (
    <aside className="hidden lg:block">
      <div className="card sticky top-28 overflow-hidden">
        <h2 className="border-b border-line px-4 py-3 text-[14px] font-extrabold">Kategori</h2>
        <ul className="max-h-[70vh] overflow-y-auto py-1.5">
          <li>
            <Link
              href="/products"
              className={cn('flex items-center gap-2.5 px-4 py-2 text-[13px] hover:bg-cream-50 hover:text-brand-700', !active ? 'font-bold text-brand-700' : 'text-ink-soft')}
            >
              Semua produk
            </Link>
          </li>
          {categories.map((c) => {
            const Icon = categoryIcon(c.slug, c.name, c.icon_name)
            const on = active === c.slug
            return (
              <li key={c.id}>
                <Link
                  href={`/kategori/${c.slug}`}
                  className={cn(
                    'flex items-center gap-2.5 border-l-[3px] px-4 py-2 text-[13px] hover:bg-cream-50 hover:text-brand-700',
                    on ? 'border-brand-600 bg-brand-50/60 font-bold text-brand-700' : 'border-transparent text-ink-soft',
                  )}
                >
                  <Icon size={16} className={on ? 'text-brand-600' : 'text-ink-faint'} />
                  <span className="line-clamp-1">{c.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
