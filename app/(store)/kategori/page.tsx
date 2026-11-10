import type { Metadata } from 'next'
import Link from 'next/link'
import { getCategories } from '@/lib/store'
import { categoryIcon, categoryTint } from '@/components/category-icon'
import { PageHeader } from '@/components/ui'

export const metadata: Metadata = { title: 'Kategori', description: 'Jelajahi produk Kedai Karuhun berdasarkan kategori.' }

export default async function KategoriPage() {
  const cats = await getCategories()
  return (
    <div className="page py-4 sm:py-6">
      <PageHeader title="Kategori" subtitle="Pilih jenis kebutuhan yang kamu cari" />
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
        {cats.map((c, i) => {
          const Icon = categoryIcon(c.slug, c.name, c.icon_name)
          return (
            <li key={c.id}>
              <Link href={`/kategori/${c.slug}`} className="card flex h-full flex-col items-center gap-2.5 p-4 text-center transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-hover active:scale-[.99]">
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                ) : (
                  <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl ${categoryTint(i)}`}><Icon size={30} /></span>
                )}
                <span className="min-w-0">
                  <span className="block text-[14px] font-bold">{c.name}</span>
                  {c.description && <span className="mt-0.5 line-clamp-2 text-[12px] text-ink-muted">{c.description}</span>}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
