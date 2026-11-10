'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Check, Minus, Plus, ShoppingCart } from 'lucide-react'
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

function QtyPicker({ qty, setQty, step, max }: { qty: number; setQty: (fn: (q: number) => number) => void; step: number; max: number }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-cream-300 bg-white">
      <button
        type="button"
        aria-label="Kurangi jumlah"
        onClick={() => setQty((q) => Math.max(step, round2(q - step)))}
        disabled={qty <= step}
        className="grid h-10 w-10 place-items-center rounded-lg text-brand-600 active:bg-cream-100 disabled:text-ink-faint"
      >
        <Minus size={16} strokeWidth={2.6} />
      </button>
      <span className="min-w-[3rem] text-center text-[15px] font-bold tabular-nums">{num(qty)}</span>
      <button
        type="button"
        aria-label="Tambah jumlah"
        onClick={() => setQty((q) => Math.min(max, round2(q + step)))}
        disabled={qty + step > max}
        className="grid h-10 w-10 place-items-center rounded-lg text-brand-600 active:bg-cream-100 disabled:text-ink-faint"
      >
        <Plus size={16} strokeWidth={2.6} />
      </button>
    </div>
  )
}

/**
 * Kotak beli. `variant="card"` untuk kolom kanan desktop,
 * `variant="bar"` untuk bar menempel di bawah layar HP.
 */
export function BuyBox({ product, variant }: { product: Product; variant: 'card' | 'bar' }) {
  const cart = useCart()
  const router = useRouter()
  const step = stepFor(product.unit)
  const [qty, setQty] = useState(step)
  const inCart = cart.ready ? cart.qtyOf(product.id) : 0
  const out = product.stock_quantity <= 0

  const buyNow = () => {
    if (inCart === 0) cart.add(product, qty)
    router.push('/checkout')
  }

  if (variant === 'bar') {
    return (
      <div className="bottom-action">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          {out ? (
            <button disabled className="btn-secondary btn-lg w-full text-ink-faint">Stok habis</button>
          ) : inCart > 0 ? (
            <>
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
                <ShoppingCart size={18} /> Lihat keranjang
              </Link>
            </>
          ) : (
            <>
              <button onClick={buyNow} className="btn-outline btn-lg flex-1 px-3">Beli langsung</button>
              <button onClick={() => cart.add(product, step)} className="btn-primary btn-lg flex-1 px-3">
                <Plus size={18} strokeWidth={2.6} /> Keranjang
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4">
      <h2 className="text-[15px] font-extrabold">Atur jumlah</h2>
      {out ? (
        <>
          <p className="mt-2 text-[13px] text-ink-muted">Produk ini sedang habis. Cek lagi nanti ya.</p>
          <button disabled className="btn-secondary mt-4 w-full text-ink-faint">Stok habis</button>
        </>
      ) : inCart > 0 ? (
        <>
          <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-brand-700">
            <Check size={16} strokeWidth={3} /> Sudah di keranjang
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <Stepper
              name={product.name}
              value={inCart}
              unit={product.unit}
              decIsRemove={inCart <= step}
              canInc={inCart + step <= product.stock_quantity}
              onDec={() => (inCart <= step ? cart.remove(product.id) : cart.setQty(product.id, round2(inCart - step)))}
              onInc={() => cart.add(product, step)}
            />
            <span className="text-[13px] text-ink-muted">Stok: <b className="text-ink">{num(product.stock_quantity)}</b></span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-[13px] text-ink-muted">Subtotal</span>
            <span className="text-lg font-extrabold">{rupiah(Math.round(product.price_idr * inCart))}</span>
          </div>
          <Link href="/cart" className="btn-primary mt-3 w-full">
            <ShoppingCart size={18} /> Lihat keranjang
          </Link>
          <Link href="/checkout" className="btn-outline mt-2 w-full">Checkout sekarang</Link>
        </>
      ) : (
        <>
          <div className="mt-3 flex items-center justify-between gap-3">
            <QtyPicker qty={qty} setQty={setQty} step={step} max={product.stock_quantity} />
            <span className="text-[13px] text-ink-muted">Stok: <b className="text-ink">{num(product.stock_quantity)}</b></span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-[13px] text-ink-muted">Subtotal</span>
            <span className="text-lg font-extrabold">{rupiah(Math.round(product.price_idr * qty))}</span>
          </div>
          <button
            onClick={() => {
              cart.add(product, qty)
              setQty(step)
            }}
            className="btn-primary mt-3 w-full"
          >
            <Plus size={18} strokeWidth={2.6} /> Keranjang
          </button>
          <button onClick={buyNow} className="btn-outline mt-2 w-full">Beli langsung</button>
        </>
      )}
    </div>
  )
}
