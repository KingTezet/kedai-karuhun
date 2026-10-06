import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PackageSearch } from 'lucide-react'
import { getCategories, queryProducts } from '@/lib/store'
import { buildHref, parseCatalogParams, type RawParams } from '@/lib/catalog-params'
import { ProductGrid } from '@/components/product-card'
import { CatalogFilters } from '@/components/catalog-filters'
import { Pagination } from '@/components/pagination'
import { EmptyState, PageHeader } from '@/components/ui'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<RawParams> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const cat = (await getCategories()).find((c) => c.slug === slug)
  if (!cat) return { title: 'Kategori tidak ditemukan' }
  const description = cat.description || `Belanja ${cat.name} segar dan berkualitas di Kedai Karuhun.`
  return {
    title: cat.name,
    description,
    openGraph: { title: `${cat.name} | Kedai Karuhun`, description },
    twitter: { title: `${cat.name} | Kedai Karuhun`, description },
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const categories = await getCategories()
  const cat = categories.find((c) => c.slug === slug)
  if (!cat) notFound()
  const query = parseCatalogParams(await searchParams, slug)
  const result = await queryProducts(query)
  const base = `/kategori/${slug}`

  return (
    <div className="page py-5 sm:py-8">
      <PageHeader title={cat.name} subtitle={cat.description || 'Pilih produk yang kamu butuhkan.'} back={{ href: '/kategori', label: 'Semua kategori' }} />
      <CatalogFilters base={base} query={query} categories={categories} showCategories={false} />
      {result.products.length === 0 ? (
        <EmptyState icon={PackageSearch} title="Belum ada produk" text="Produk di kategori ini sedang disiapkan." action={{ label: 'Lihat produk lain', href: '/products' }} />
      ) : (
        <>
          <ProductGrid products={result.products} />
          <Pagination page={result.page} pages={result.pages} hrefFor={(p) => buildHref(base, query, { page: p })} />
        </>
      )}
    </div>
  )
}
