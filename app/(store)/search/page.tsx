import type { Metadata } from 'next'
import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { getCategories, queryProducts } from '@/lib/store'
import { buildHref, parseCatalogParams, type RawParams } from '@/lib/catalog-params'
import { ProductGrid } from '@/components/product-card'
import { CatalogFilters } from '@/components/catalog-filters'
import { Pagination } from '@/components/pagination'
import { SearchBox } from '@/components/search-box'
import { EmptyState } from '@/components/ui'
import { categoryIcon, categoryTint } from '@/components/category-icon'

export const metadata: Metadata = { title: 'Cari produk', robots: { index: false } }

export default async function SearchPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const query = parseCatalogParams(await searchParams)
  const categories = await getCategories()
  const searching = !!query.q
  const result = searching ? await queryProducts(query) : null

  return (
    <div className="page py-5 sm:py-8">
      <SearchBox initial={query.q ?? ''} showRecent={!searching} />

      {!searching && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-bold text-ink-muted">Atau lihat kategori</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((c, i) => {
              const Icon = categoryIcon(c.slug, c.name, c.icon_name)
              return (
                <Link key={c.id} href={`/kategori/${c.slug}`} className="card flex min-h-[64px] items-center gap-3 p-3 transition active:scale-[.98]">
                  {c.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image_url} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${categoryTint(i)}`}><Icon size={22} /></span>
                  )}
                  <span className="text-sm font-bold leading-tight">{c.name}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {result && (
        <section className="mt-6">
          <p className="mb-3 text-[15px] text-ink-muted">
            {result.total > 0 ? <>{result.total} hasil untuk <b className="text-ink">“{query.q}”</b></> : <>Tidak ada hasil untuk <b className="text-ink">“{query.q}”</b></>}
          </p>
          <CatalogFilters base="/search" query={query} categories={categories} showCategories={false} />
          {result.products.length === 0 ? (
            <EmptyState icon={SearchX} title="Produk tidak ditemukan" text="Coba kata lain yang lebih singkat, misalnya “telur” atau “beras”." action={{ label: 'Lihat semua produk', href: '/products' }} />
          ) : (
            <>
              <ProductGrid products={result.products} />
              <Pagination page={result.page} pages={result.pages} hrefFor={(p) => buildHref('/search', query, { page: p })} />
            </>
          )}
        </section>
      )}
    </div>
  )
}
