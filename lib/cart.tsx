'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { Product } from '@/types'
import { useToast } from '@/lib/toast'
import { track } from '@/lib/analytics'
import { clampQty, round2, stepFor } from '@/lib/units'
import { num, rupiah } from '@/lib/utils'

export type CartLine = {
  productId: string
  slug: string
  name: string
  price: number
  unit: string
  image: string | null
  stock: number
  qty: number
}

type ProductLike = Pick<Product, 'id' | 'slug' | 'name' | 'price_idr' | 'unit' | 'image_url' | 'stock_quantity'>

type CartApi = {
  lines: CartLine[]
  ready: boolean
  count: number
  subtotal: number
  bump: number
  qtyOf: (id: string) => number
  add: (p: ProductLike, qty?: number) => void
  setQty: (id: string, qty: number) => void
  remove: (id: string) => void
  clear: () => void
  /** sinkronkan harga/stok terbaru dari server */
  sync: (fresh: Array<{ id: string; price_idr: number; stock_quantity: number; unit: string; name: string; image_url: string | null; is_active: boolean }>) => CartChange[]
}

export type CartChange = { productId: string; name: string; kind: 'removed' | 'stock' | 'price'; detail: string }

const KEY = 'kk-cart-v2'
const Ctx = createContext<CartApi | null>(null)

export function useCart() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCart harus di dalam CartProvider')
  return c
}

function read(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(raw) ? raw.filter((l) => l && l.productId && l.qty > 0) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast()
  const [lines, setLines] = useState<CartLine[]>([])
  const [ready, setReady] = useState(false)
  const [bump, setBump] = useState(0)
  const ref = useRef<CartLine[]>([])
  ref.current = lines

  useEffect(() => {
    setLines(read())
    setReady(true)
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setLines(read())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const commit = useCallback((next: CartLine[]) => {
    ref.current = next
    setLines(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {}
  }, [])

  const add = useCallback<CartApi['add']>(
    (p, qtyIn) => {
      const step = stepFor(p.unit)
      const want = qtyIn ?? step
      if (p.stock_quantity <= 0) {
        toast.error(`${p.name} sedang habis`)
        return
      }
      const cur = ref.current
      const i = cur.findIndex((l) => l.productId === p.id)
      const had = i >= 0 ? cur[i].qty : 0
      const target = round2(had + want)
      const next = clampQty(target, p.unit, p.stock_quantity)
      if (next <= had) {
        toast.info(`Stok ${p.name} hanya ${num(p.stock_quantity)} ${p.unit}`, {
          description: 'Jumlah di keranjang sudah maksimal.',
        })
        return
      }
      const line: CartLine = {
        productId: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price_idr,
        unit: p.unit,
        image: p.image_url,
        stock: p.stock_quantity,
        qty: next,
      }
      commit(i >= 0 ? cur.map((l, k) => (k === i ? line : l)) : [...cur, line])
      setBump((b) => b + 1)
      try {
        navigator.vibrate?.(12)
      } catch {}
      track('add_to_cart', { item_id: p.id, quantity: next - had, value: p.price_idr * (next - had), currency: 'IDR' })
      if (had === 0) {
        toast.success(`${p.name} masuk keranjang`, {
          description: `${num(next)} ${p.unit} · ${rupiah(p.price_idr * next)}`,
          action: { label: 'Lihat', href: '/cart' },
        })
      } else if (next < target) {
        toast.info(`Maksimal ${num(p.stock_quantity)} ${p.unit}`, { description: 'Sesuai stok yang tersedia.' })
      }
    },
    [commit, toast],
  )

  const setQty = useCallback<CartApi['setQty']>(
    (id, qty) => {
      const cur = ref.current
      const l = cur.find((x) => x.productId === id)
      if (!l) return
      const next = clampQty(qty, l.unit, l.stock)
      if (next <= 0) return
      if (qty > l.stock) toast.info(`Maksimal ${num(l.stock)} ${l.unit}`, { description: `Stok ${l.name} terbatas.` })
      commit(cur.map((x) => (x.productId === id ? { ...x, qty: next } : x)))
    },
    [commit, toast],
  )

  const remove = useCallback<CartApi['remove']>(
    (id) => {
      const cur = ref.current
      const idx = cur.findIndex((x) => x.productId === id)
      if (idx < 0) return
      const gone = cur[idx]
      commit(cur.filter((x) => x.productId !== id))
      toast.info(`${gone.name} dihapus`, {
        action: {
          label: 'Urungkan',
          onClick: () => {
            const now = ref.current
            if (now.some((x) => x.productId === gone.productId)) return
            const copy = [...now]
            copy.splice(Math.min(idx, copy.length), 0, gone)
            commit(copy)
          },
        },
      })
    },
    [commit, toast],
  )

  const clear = useCallback(() => commit([]), [commit])

  const sync = useCallback<CartApi['sync']>(
    (fresh) => {
      const changes: CartChange[] = []
      const map = new Map(fresh.map((f) => [f.id, f]))
      const next: CartLine[] = []
      for (const l of ref.current) {
        const f = map.get(l.productId)
        if (!f || !f.is_active || f.stock_quantity <= 0) {
          changes.push({
            productId: l.productId,
            name: l.name,
            kind: 'removed',
            detail: !f || !f.is_active ? 'sudah tidak dijual' : 'stok habis',
          })
          continue
        }
        let qty = l.qty
        if (qty > f.stock_quantity) {
          qty = clampQty(f.stock_quantity, f.unit, f.stock_quantity)
          changes.push({
            productId: l.productId,
            name: l.name,
            kind: 'stock',
            detail: `stok tinggal ${num(f.stock_quantity)} ${f.unit}, jumlah disesuaikan`,
          })
        }
        if (f.price_idr !== l.price) {
          changes.push({
            productId: l.productId,
            name: l.name,
            kind: 'price',
            detail: `harga berubah dari ${rupiah(l.price)} menjadi ${rupiah(f.price_idr)}`,
          })
        }
        next.push({ ...l, name: f.name, unit: f.unit, image: f.image_url, price: f.price_idr, stock: f.stock_quantity, qty })
      }
      if (changes.length || next.length !== ref.current.length || JSON.stringify(next) !== JSON.stringify(ref.current)) {
        commit(next)
      }
      return changes
    },
    [commit],
  )

  const value = useMemo<CartApi>(
    () => ({
      lines,
      ready,
      count: lines.length,
      subtotal: lines.reduce((s, l) => s + Math.round(l.price * l.qty), 0),
      bump,
      qtyOf: (id) => lines.find((l) => l.productId === id)?.qty ?? 0,
      add,
      setQty,
      remove,
      clear,
      sync,
    }),
    [lines, ready, bump, add, setQty, remove, clear, sync],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
