import Link from 'next/link'
import type { Product } from '@/types'
import { num, rupiah } from '@/lib/utils'
import { AddButton } from '@/components/add-button'
import { ProductImage } from '@/components/ui'

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const out = product.stock_quantity <= 0
  const low = !out && product.stock_quantity <= product.low_stock_threshold
  const discount =
    product.compare_at_price_idr && product.compare_at_price_idr > product.price_idr
      ? Math.round((1 - product.price_idr / product.compare_at_price_idr) * 100)
      : 0

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <Link href={`/products/${product.slug}`} className="group block" aria-label={`Lihat ${product.name}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-cream-200">
          <ProductImage
            src={product.image_url}
            name={product.name}
            priority={priority}
            sizes="(min-width:1024px) 22vw, (min-width:640px) 31vw, 47vw"
            className={out ? 'opacity-50 grayscale' : 'transition duration-300 group-hover:scale-[1.03]'}
          />
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {out && <span className="badge bg-ink text-white">Habis</span>}
            {discount > 0 && !out && <span className="badge bg-accent-500 text-white">Hemat {discount}%</span>}
            {low && <span className="badge bg-amber-100 text-amber-900">Sisa {num(product.stock_quantity)}</span>}
          </div>
        </div>
        <div className="px-3 pb-1 pt-3">
          <p className="line-clamp-2 min-h-[2.6rem] text-[15px] font-semibold leading-snug">{product.name}</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[17px] font-extrabold text-brand-700">{rupiah(product.price_idr)}</span>
            <span className="text-[13px] text-ink-muted">/ {product.unit}</span>
          </p>
          {discount > 0 && <p className="text-xs text-ink-faint line-through">{rupiah(product.compare_at_price_idr)}</p>}
        </div>
      </Link>
      <div className="mt-auto px-3 pb-3 pt-2">
        <AddButton product={product} />
      </div>
    </article>
  )
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  )
}
