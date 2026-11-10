'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, CircleAlert, ShoppingBasket, Trash2 } from 'lucide-react'
import { useCart, type CartChange } from '@/lib/cart'
import { useToast } from '@/lib/toast'
import { stepFor, round2 } from '@/lib/units'
import { num, rupiah } from '@/lib/utils'
import { Stepper } from '@/components/stepper'
import { Sheet } from '@/components/sheet'
import { EmptyState, ProductImage, Skeleton } from '@/components/ui'

export async function fetchFresh(ids: string[]) {
  const res = await fetch('/api/cart/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) })
  const json = await res.json()
  if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal memeriksa keranjang.')
  return json.products as Array<{ id: string; price_idr: number; stock_quantity: number; unit: string; name: string; image_url: string | null; is_active: boolean }>
}

export function CartView() {
  const cart = useCart()
  const toast = useToast()
  const [changes, setChanges] = useState<CartChange[]>([])
  const [checking, setChecking] = useState(true)
  const [confirmClear, setConfirmClear] = useState(false)

  const check = useCallback(async () => {
    if (!cart.lines.length) return setChecking(false)
    try {
      const fresh = await fetchFresh(cart.lines.map((l) => l.productId))
      setChanges(cart.sync(fresh))
    } catch {
      /* offline: tetap pakai data lokal */
    } finally {
      setChecking(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.ready])

  useEffect(() => {
    if (cart.ready) check()
  }, [cart.ready, check])

  if (!cart.ready) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}
      </div>
    )
  }

  if (cart.lines.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBasket}
        title="Keranjang masih kosong"
        text="Yuk pilih sayur, buah, atau kebutuhan dapur favoritmu."
        action={{ label: 'Mulai belanja', href: '/products' }}
      />
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start lg:gap-6">
      <div className="space-y-3">
        {changes.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4" role="alert">
            <p className="flex items-center gap-2 font-bold text-amber-900"><CircleAlert size={20} /> Keranjang diperbarui</p>
            <ul className="mt-2 space-y-1 text-[14px] text-amber-900">
              {changes.map((c, i) => (
                <li key={i}>• <b>{c.name}</b> {c.detail}</li>
              ))}
            </ul>
            <button onClick={() => setChanges([])} className="btn-ghost btn-sm mt-2 text-amber-900">Mengerti</button>
          </div>
        )}

        <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-[14px] font-extrabold">Semua barang <span className="font-semibold text-ink-muted">({cart.count})</span></p>
          <button onClick={() => setConfirmClear(true)} className="inline-flex items-center gap-1 text-[13px] font-bold text-sale-500 hover:text-sale-600">
            <Trash2 size={15} /> Hapus semua
          </button>
        </div>
        <ul className="divide-y divide-line">
          {cart.lines.map((l) => {
            const step = stepFor(l.unit)
            return (
              <li key={l.productId} className="flex gap-3 p-4">
                <Link href={`/products/${l.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line/70 bg-cream-100 sm:h-24 sm:w-24">
                  <ProductImage src={l.image} name={l.name} sizes="112px" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link href={`/products/${l.slug}`} className="line-clamp-2 text-[14px] leading-snug hover:text-brand-700">{l.name}</Link>
                  <p className="mt-0.5 text-[12px] text-ink-muted">{rupiah(l.price)} / {l.unit}</p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                    <Stepper
                      size="sm"
                      name={l.name}
                      value={l.qty}
                      unit={l.unit}
                      decIsRemove={l.qty <= step}
                      canInc={l.qty + step <= l.stock}
                      onDec={() => (l.qty <= step ? cart.remove(l.productId) : cart.setQty(l.productId, round2(l.qty - step)))}
                      onInc={() => cart.setQty(l.productId, round2(l.qty + step))}
                    />
                    <p className="text-[15px] font-extrabold">{rupiah(Math.round(l.price * l.qty))}</p>
                  </div>
                  {l.qty >= l.stock && <p className="mt-1 text-xs font-semibold text-amber-800">Stok tinggal {num(l.stock)} {l.unit}</p>}
                </div>
              </li>
            )
          })}
        </ul>
        </div>

        <Link href="/products" className="section-link px-1">+ Tambah barang lain</Link>
      </div>

      <aside className="card hidden p-5 lg:sticky lg:top-28 lg:block">
        <Summary />
        <Link href="/checkout" className="btn-primary btn-lg mt-5 w-full">
          Beli ({cart.count}) <ArrowRight size={18} />
        </Link>
      </aside>

      <div className="bottom-action">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[12px] text-ink-muted">Total sementara</p>
            <p className="text-lg font-extrabold">{rupiah(cart.subtotal)}</p>
          </div>
          <Link href="/checkout" className="btn-primary btn-lg px-7">
            Beli ({cart.count})
          </Link>
        </div>
      </div>

      <Sheet
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Kosongkan keranjang?"
        description="Semua barang di keranjang akan dihapus."
        footer={
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setConfirmClear(false)}>Batal</button>
            <button
              className="btn-danger flex-1"
              onClick={() => {
                cart.clear()
                setConfirmClear(false)
                toast.info('Keranjang dikosongkan')
              }}
            >
              Ya, kosongkan
            </button>
          </div>
        }
      >
        <p className="text-[15px] text-ink-muted">Kamu punya {cart.count} jenis barang di keranjang.</p>
      </Sheet>
      {checking && <span className="sr-only" role="status">Memeriksa harga dan stok terbaru</span>}
    </div>
  )
}

function Summary() {
  const cart = useCart()
  return (
    <>
      <h2 className="text-[15px] font-extrabold">Ringkasan belanja</h2>
      <dl className="mt-3 space-y-2 text-[14px]">
        <div className="flex justify-between"><dt className="text-ink-muted">Subtotal ({cart.count} jenis)</dt><dd className="font-semibold">{rupiah(cart.subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-ink-muted">Ongkos kirim</dt><dd className="text-ink-muted">Dihitung di checkout</dd></div>
      </dl>
      <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
        <span className="font-bold">Total</span>
        <span className="text-xl font-extrabold">{rupiah(cart.subtotal)}</span>
      </div>
    </>
  )
}
