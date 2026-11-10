import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Clock, ShieldCheck, Truck } from 'lucide-react'
import { getProduct, getRelated, getSettings } from '@/lib/store'
import { num, rupiah } from '@/lib/utils'
import { BuyBox, TrackView } from '@/components/buy-box'
import { ProductGrid, discountOf } from '@/components/product-card'
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
  const discount = discountOf(product)

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
    <div className="page pb-28 pt-3 sm:pt-5 lg:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TrackView id={product.id} name={product.name} price={product.price_idr} />

      <nav aria-label="Jejak halaman" className="mb-3 flex flex-wrap items-center gap-1.5 text-[13px] text-ink-muted">
        <Link href="/" className="font-semibold text-brand-600 hover:text-brand-700">Beranda</Link>
        <ChevronRight size={14} aria-hidden />
        {product.category && (
          <>
            <Link href={`/kategori/${product.category.slug}`} className="font-semibold text-brand-600 hover:text-brand-700">{product.category.name}</Link>
            <ChevronRight size={14} aria-hidden />
          </>
        )}
        <span className="line-clamp-1 text-ink-soft">{product.name}</span>
      </nav>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,5fr)_300px] lg:items-start lg:gap-6">
        {/* Foto */}
        <div className="-mx-4 sm:mx-0 lg:sticky lg:top-28">
          <div className="relative aspect-square overflow-hidden bg-white sm:rounded-xl sm:border sm:border-line/70">
            <ProductImage src={product.image_url} name={product.name} priority sizes="(min-width:1024px) 40vw, 100vw" className={out ? 'opacity-60 grayscale' : ''} />
            {out && <span className="badge absolute left-3 top-3 bg-ink px-3 py-1.5 text-[12px] text-white">Stok habis</span>}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-3">
          <section className="card p-4 sm:p-5">
            <h1 className="text-[18px] font-bold leading-snug sm:text-[22px]">{product.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted">
              {product.category && <Link href={`/kategori/${product.category.slug}`} className="hover:text-brand-700">{product.category.name}</Link>}
              {product.sku && <span>SKU {product.sku}</span>}
              <span>Satuan: {product.unit}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-[26px] font-extrabold leading-none sm:text-[30px]">{rupiah(product.price_idr)}</span>
              <span className="text-[14px] text-ink-muted">/ {product.unit}</span>
            </div>
            {discount > 0 && (
              <p className="mt-1.5 flex items-center gap-2 text-[13px]">
                <span className="rounded bg-sale-50 px-1.5 py-0.5 font-bold text-sale-500">{discount}%</span>
                <span className="text-ink-faint line-through">{rupiah(product.compare_at_price_idr)}</span>
              </p>
            )}
            <div className="mt-3">
              {out ? <Badge tone="bad">Stok habis</Badge> : low ? <Badge tone="warn">Sisa {num(product.stock_quantity)} {product.unit}</Badge> : <Badge tone="good">Stok tersedia</Badge>}
            </div>
          </section>

          {(product.description || product.short_description) && (
            <section className="card p-4 sm:p-5">
              <h2 className="border-b border-line pb-2 text-[15px] font-extrabold">Detail produk</h2>
              <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-ink-soft">{product.description || product.short_description}</p>
            </section>
          )}

          <section className="card p-4 sm:p-5">
            <h2 className="border-b border-line pb-2 text-[15px] font-extrabold">Pengiriman & layanan</h2>
            <ul className="mt-3 space-y-3 text-[14px] text-ink-soft">
              <li className="flex items-start gap-3"><Truck size={18} className="mt-0.5 shrink-0 text-brand-600" /> Diantar langsung oleh {settings?.store_name || 'Kedai Karuhun'}. Ongkir dihitung saat checkout.</li>
              <li className="flex items-start gap-3"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand-600" /> Harga & stok selalu diperbarui toko.</li>
              {settings?.open_hours && <li className="flex items-start gap-3"><Clock size={18} className="mt-0.5 shrink-0 text-brand-600" /> {settings.open_hours}</li>}
            </ul>
          </section>
        </div>

        {/* Kotak beli (desktop) */}
        <div className="hidden lg:sticky lg:top-28 lg:block">
          <BuyBox product={product} variant="card" />
        </div>
      </div>

      <BuyBox product={product} variant="bar" />

      {related.length > 0 && (
        <section className="mt-8" aria-labelledby="serupa">
          <h2 id="serupa" className="section-title mb-3">Produk serupa</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  )
}
