'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, ShoppingBasket } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { rupiah } from '@/lib/utils'

const HIDE = ['/cart', '/checkout', '/orders', '/account', '/login', '/register', '/support', '/privacy', '/terms']

/** Bar ringkas di atas menu bawah: selalu menunjukkan isi & total keranjang. */
export function FloatingCartBar() {
  const { count, subtotal, ready, bump } = useCart()
  const pathname = usePathname()
  if (!ready || count === 0) return null
  if (HIDE.some((p) => pathname.startsWith(p))) return null
  if (pathname.startsWith('/products/')) return null // halaman produk punya bar sendiri
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(64px+var(--safe-b)+10px)] z-40 px-3 lg:bottom-6 lg:left-auto lg:right-6 lg:w-80 lg:px-0">
      <Link
        key={bump}
        href="/cart"
        className="pointer-events-auto flex animate-pop items-center gap-3 rounded-xl bg-brand-600 px-3 py-2.5 text-white shadow-pop hover:bg-brand-700 active:scale-[.99]"
      >
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15">
          <ShoppingBasket size={22} />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[12px] text-white/80">{count} jenis barang</span>
          <span className="block text-[15px] font-extrabold">{rupiah(subtotal)}</span>
        </span>
        <span className="flex items-center text-[14px] font-bold">
          Keranjang <ChevronRight size={20} />
        </span>
      </Link>
    </div>
  )
}
