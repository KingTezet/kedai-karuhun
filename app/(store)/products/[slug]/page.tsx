import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Clock, ShieldCheck, Truck } from 'lucide-react'
import { getProduct, getRelated, getSettings } from '@/lib/store'
import { num, rupiah } from '@/lib/utils'
import { BuyBox, TrackView } from '@/components/buy-box'
import { ProductGrid } from '@/components/product-card'
import { Badge, ProductImage } from '@/components/ui'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = await getProduct(slug)
  if (!p) return { title: 'Produk tidak ditemukan' }
  const description = p.short_description || p.description?.slice(0, 150) || `Beli ${p.name} di Kedai Karuhun, diantar ke rumah.`
  const title = `${p.name} — ${rupiah(p.price_idr)}/${p.unit}`
  return {
    title,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title, description, type: 'website', images: p.image_url ? [{ url: p.image_url, alt: p.name }] : undefined },
    twitter: { card: p.image_url ? 'summary_large_image' : 'summary', title, description, images: p.image_url ? [p.image_url] : undefined },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()
  const [related, settings] = await Promise.all([getRelated(product), getSettings()])
  const out = product.stock_quantity <= 0
  const low = !out && product.stock_quantity <= product.low_stock_threshold
  const discount =
    product.compare_at_price_idr && product.compare_at_price_idr > product.price_idr
      ? Math.round((1 - product.price_idr / product.compare_at_price_idr) * 100)
      : 0

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image_url ?? undefined,
    description: product.short_description || product.description || undefined,
    sku: product.sku ?? undefined,
    offers: { '@type': 'Offer', priceCurrency: 'IDR', price: product.price_idr, availability: out ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock' },
  }

  return (
    <div className="page pb-44 pt-4 sm:pt-6 lg:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TrackView id={product.id} name={product.name} price={product.price_idr} />

      <nav aria-label="Jejak halaman" className="mb-3 flex flex-wrap items-center gap-1 text-sm text-ink-muted">
        <Link href="/" className="inline-flex min-h-[36px] items-center hover:text-ink">Beranda</Link>
        <span aria-hidden>›</span>
        {product.category && (
          <>
            <Link href={`/kategori/${product.category.slug}`} className="inline-flex min-h-[36px] items-center hover:text-ink">{product.category.name}</Link>
            <span aria-hidden>›</span>
          </>
        )}
        <span className="line-clamp-1 font-semibold text-ink-soft">{product.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-line bg-cream-200 shadow-card">
          <ProductImage src={product.image_url} name={product.name} priority sizes="(min-width:1024px) 50vw, 100vw" className={out ? 'opacity-60 grayscale' : ''} />
          {out && <span className="badge absolute left-3 top-3 bg-ink px-3 py-1.5 text-sm text-white">Stok habis</span>}
          {discount > 0 && !out && <span className="badge absolute left-3 top-3 bg-accent-500 px-3 py-1.5 text-sm text-white">Hemat {discount}%</span>}
        </div>

        <div>
          {product.category && <p className="text-sm font-bold text-brand-700">{product.category.name}</p>}
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-3xl font-extrabold text-brand-700">{rupiah(product.price_idr)}</span>
            <span className="text-base text-ink-muted">/ {product.unit}</span>
            {discount > 0 && <span className="text-base text-ink-faint line-through">{rupiah(product.compare_at_price_idr)}</span>}
          </div>

          <div className="mt-3">
            {out ? <Badge tone="bad">Stok habis</Badge> : low ? <Badge tone="warn">Sisa {num(product.stock_quantity)} {product.unit}</Badge> : <Badge tone="good">Tersedia</Badge>}
          </div>

          {(product.description || product.short_description) && (
            <div className="mt-5">
              <h2 className="mb-1 text-base font-bold">Tentang produk</h2>
              <p className="whitespace-pre-line text-[16px] leading-relaxed text-ink-soft">{product.description || product.short_description}</p>
            </div>
          )}

          <div className="mt-6 hidden lg:block"><BuyBox product={product} /></div>

          <ul className="mt-6 space-y-3 rounded-2xl border border-line bg-white p-4 text-[15px]">
            <li className="flex items-start gap-3"><Truck size={20} className="mt-0.5 shrink-0 text-brand-600" /> Diantar langsung oleh {settings?.store_name || 'Kedai Karuhun'}. Ongkir dihitung saat checkout.</li>
            <li className="flex items-start gap-3"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-brand-600" /> Harga & stok selalu diperbarui toko.</li>
            {settings?.open_hours && <li className="flex items-start gap-3"><Clock size={20} className="mt-0.5 shrink-0 text-brand-600" /> {settings.open_hours}</li>}
          </ul>
        </div>
      </div>

      <div className="lg:hidden"><BuyBox product={product} /></div>

      {related.length > 0 && (
        <section className="mt-10" aria-labelledby="serupa">
          <h2 id="serupa" className="section-title mb-3">Produk serupa</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  )
}
