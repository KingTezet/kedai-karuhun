import Link from 'next/link'
import type { Product } from '@/types'
import { num, rupiah } from '@/lib/utils'
import { AddButton } from '@/components/add-button'
import { ProductImage } from '@/components/ui'
import { cn } from '@/lib/utils'

export function discountOf(product: Pick<Product, 'price_idr' | 'compare_at_price_idr'>) {
  return product.compare_at_price_idr && product.compare_at_price_idr > product.price_idr
    ? Math.round((1 - product.price_idr / product.compare_at_price_idr) * 100)
    : 0
}

export function ProductCard({ product, priority, className }: { product: Product; priority?: boolean; className?: string }) {
  const out = product.stock_quantity <= 0
  const low = !out && product.stock_quantity <= product.low_stock_threshold
  const discount = discountOf(product)

  return (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-xl border border-line/70 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-hover',
        className,
      )}
    >
      <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col" aria-label={`Lihat ${product.name}`}>
        <div className="relative aspect-square overflow-hidden bg-cream-100">
          <ProductImage
            src={product.image_url}
            name={product.name}
            priority={priority}
            sizes="(min-width:1280px) 16vw, (min-width:1024px) 20vw, (min-width:640px) 31vw, 47vw"
            className={out ? 'opacity-50 grayscale' : 'transition duration-300 group-hover:scale-[1.04]'}
          />
          {out && (
            <div className="absolute inset-0 grid place-items-center">
              <span className="rounded-full bg-ink/75 px-3 py-1.5 text-[12px] font-bold text-white">Stok habis</span>
            </div>
          )}
          {product.is_featured && !out && (
            <span className="absolute left-0 top-2 rounded-r-md bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Pilihan</span>
          )}
        </div>
        <div className="flex flex-1 flex-col px-2.5 pb-1 pt-2 sm:px-3">
          <p className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-[1.25rem] text-ink sm:text-[14px]">{product.name}</p>
          <p className="mt-1 text-[15px] font-extrabold text-ink sm:text-base">
            {rupiah(product.price_idr)}
            <span className="ml-1 text-[11px] font-medium text-ink-muted">/{product.unit}</span>
          </p>
          {discount > 0 && (
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px]">
              <span className="rounded bg-sale-50 px-1 py-px font-bold text-sale-500">{discount}%</span>
              <span className="text-ink-faint line-through">{rupiah(product.compare_at_price_idr)}</span>
            </p>
          )}
          {low && <p className="mt-1 text-[11px] font-semibold text-accent-600">Sisa {num(product.stock_quantity)} {product.unit} lagi</p>}
        </div>
      </Link>
      <div className="px-2.5 pb-2.5 pt-1.5 sm:px-3 sm:pb-3">
        <AddButton product={product} />
      </div>
    </article>
  )
}

export function ProductGrid({ products, dense }: { products: Product[]; dense?: boolean }) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3',
        dense ? 'md:grid-cols-4 xl:grid-cols-5' : 'md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
      )}
    >
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  )
}

/** Baris produk geser horizontal (HP), grid di desktop. */
export function ProductRail({ products }: { products: Product[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-5 lg:gap-3 lg:overflow-visible xl:grid-cols-6">
      {products.map((p) => (
        <div key={p.id} className="w-[148px] shrink-0 snap-start sm:w-[176px] lg:w-auto">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  )
}
