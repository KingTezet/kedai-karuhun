import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getCategories } from '@/lib/store'
import { categoryIcon, categoryTint } from '@/components/category-icon'
import { PageHeader } from '@/components/ui'

export const metadata: Metadata = { title: 'Kategori', description: 'Jelajahi produk Kedai Karuhun berdasarkan kategori.' }

export default async function KategoriPage() {
  const cats = await getCategories()
  return (
    <div className="page py-5 sm:py-8">
      <PageHeader title="Kategori" subtitle="Pilih jenis kebutuhan yang kamu cari" />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((c, i) => {
          const Icon = categoryIcon(c.slug, c.name, c.icon_name)
          return (
            <li key={c.id}>
              <Link href={`/kategori/${c.slug}`} className="card flex min-h-[76px] items-center gap-4 p-4 transition active:scale-[.99] hover:border-brand-300">
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
                ) : (
                  <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${categoryTint(i)}`}><Icon size={28} /></span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-bold">{c.name}</span>
                  {c.description && <span className="line-clamp-1 text-sm text-ink-muted">{c.description}</span>}
                </span>
                <ChevronRight className="shrink-0 text-ink-faint" />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
