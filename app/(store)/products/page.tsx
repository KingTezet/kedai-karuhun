import type { Metadata } from 'next'
import { PackageSearch } from 'lucide-react'
import { getCategories, queryProducts } from '@/lib/store'
import { buildHref, parseCatalogParams, type RawParams } from '@/lib/catalog-params'
import { ProductGrid } from '@/components/product-card'
import { CatalogFilters } from '@/components/catalog-filters'
import { Pagination } from '@/components/pagination'
import { EmptyState, PageHeader } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Belanja',
  description: 'Semua produk Kedai Karuhun: sembako, sayur, buah, telur, minuman, dan kebutuhan rumah.',
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const query = parseCatalogParams(await searchParams)
  const [categories, result] = await Promise.all([getCategories(), queryProducts(query)])
  const activeCat = categories.find((c) => c.slug === query.category)

  return (
    <div className="page py-5 sm:py-8">
      <PageHeader
        title={activeCat ? activeCat.name : 'Belanja'}
        subtitle={result.total ? `${result.total} produk` : 'Pilih kebutuhanmu hari ini'}
      />
      <CatalogFilters base="/products" query={query} categories={categories} />
      {result.products.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="Produk tidak ditemukan"
          text="Coba ubah filter atau pilih kategori lain."
          action={{ label: 'Lihat semua produk', href: '/products' }}
        />
      ) : (
        <>
          <ProductGrid products={result.products} />
          <Pagination page={result.page} pages={result.pages} hrefFor={(p) => buildHref('/products', query, { page: p })} />
        </>
      )}
    </div>
  )
}
