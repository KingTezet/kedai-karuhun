'use client'

import { Plus } from 'lucide-react'
import type { Product } from '@/types'
import { useCart } from '@/lib/cart'
import { stepFor } from '@/lib/units'
import { Stepper } from '@/components/stepper'
import { cn } from '@/lib/utils'

/** Tombol tambah di kartu produk: berubah jadi stepper setelah masuk keranjang. */
export function AddButton({ product }: { product: Product }) {
  const cart = useCart()
  const qty = cart.ready ? cart.qtyOf(product.id) : 0
  const step = stepFor(product.unit)

  if (product.stock_quantity <= 0) {
    return (
      <button disabled className="btn-secondary w-full cursor-not-allowed text-ink-faint">
        Stok habis
      </button>
    )
  }
  if (qty > 0) {
    return (
      <Stepper
        full
        name={product.name}
        value={qty}
        unit={product.unit}
        decIsRemove={qty <= step}
        canInc={qty + step <= product.stock_quantity}
        onDec={() => (qty <= step ? cart.remove(product.id) : cart.setQty(product.id, qty - step))}
        onInc={() => cart.add(product, step)}
      />
    )
  }
  return (
    <button onClick={() => cart.add(product)} className={cn('btn-primary w-full')} aria-label={`Tambah ${product.name} ke keranjang`}>
      <Plus size={18} />
      Tambah
    </button>
  )
}
