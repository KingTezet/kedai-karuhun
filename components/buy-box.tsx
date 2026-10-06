'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import type { Product } from '@/types'
import { useCart } from '@/lib/cart'
import { stepFor, round2 } from '@/lib/units'
import { track } from '@/lib/analytics'
import { num, rupiah } from '@/lib/utils'
import { Stepper } from '@/components/stepper'

export function TrackView({ id, name, price }: { id: string; name: string; price: number }) {
  useEffect(() => {
    track('view_product', { item_id: id, item_name: name, value: price, currency: 'IDR' })
  }, [id, name, price])
  return null
}

/** Kotak beli di halaman detail. Di HP menempel di atas menu bawah. */
export function BuyBox({ product }: { product: Product }) {
  const cart = useCart()
  const step = stepFor(product.unit)
  const [qty, setQty] = useState(step)
  const inCart = cart.ready ? cart.qtyOf(product.id) : 0
  const out = product.stock_quantity <= 0

  const bar = 'fixed inset-x-0 bottom-[calc(64px+var(--safe-b))] z-40 border-t border-line bg-white p-3 shadow-nav lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none'

  if (out) {
    return (
      <div className={bar}>
        <button disabled className="btn-secondary btn-lg w-full text-ink-faint">Stok habis</button>
      </div>
    )
  }

  if (inCart > 0) {
    return (
      <div className={bar}>
        <div className="mx-auto flex max-w-lg items-center gap-3 lg:max-w-none">
          <Stepper
            name={product.name}
            value={inCart}
            unit={product.unit}
            decIsRemove={inCart <= step}
            canInc={inCart + step <= product.stock_quantity}
            onDec={() => (inCart <= step ? cart.remove(product.id) : cart.setQty(product.id, round2(inCart - step)))}
            onInc={() => cart.add(product, step)}
          />
          <Link href="/cart" className="btn-primary btn-lg flex-1">
            <ShoppingCart size={20} /> Lihat keranjang
          </Link>
        </div>
        <p className="mt-2 hidden text-sm text-brand-700 lg:block">✓ Sudah di keranjang · {rupiah(Math.round(product.price_idr * inCart))}</p>
      </div>
    )
  }

  return (
    <div className={bar}>
      <div className="mx-auto flex max-w-lg items-center gap-3 lg:max-w-none">
        <div className="inline-flex items-center rounded-xl border border-line bg-white">
          <button
            type="button"
            aria-label="Kurangi jumlah"
            onClick={() => setQty((q) => Math.max(step, round2(q - step)))}
            className="grid h-12 w-12 place-items-center rounded-xl text-ink-soft active:bg-cream-200"
          >
            <Minus size={18} />
          </button>
          <span className="min-w-[3.5rem] text-center font-bold tabular-nums">{num(qty)}</span>
          <button
            type="button"
            aria-label="Tambah jumlah"
            onClick={() => setQty((q) => Math.min(product.stock_quantity, round2(q + step)))}
            disabled={qty + step > product.stock_quantity}
            className="grid h-12 w-12 place-items-center rounded-xl text-ink-soft active:bg-cream-200 disabled:opacity-40"
          >
            <Plus size={18} />
          </button>
        </div>
        <button
          onClick={() => {
            cart.add(product, qty)
            setQty(step)
          }}
          className="btn-primary btn-lg flex-1"
        >
          <ShoppingCart size={20} />
          <span>Tambah · {rupiah(Math.round(product.price_idr * qty))}</span>
        </button>
      </div>
    </div>
  )
}
