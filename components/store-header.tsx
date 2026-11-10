'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Grid2x2, HelpCircle, Home, LayoutGrid, Package, Search, ShoppingCart, Truck, User } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { InstallButton } from '@/components/install-button'
import { cn } from '@/lib/utils'

function CartBadge({ className }: { className?: string }) {
  const { count, bump, ready } = useCart()
  if (!ready || count === 0) return null
  return (
    <span
      key={bump}
      className={cn(
        'absolute grid h-[18px] min-w-[18px] animate-bump place-items-center rounded-full bg-sale-500 px-1 text-[10px] font-extrabold leading-none text-white ring-2 ring-white',
        className,
      )}
      aria-label={`${count} jenis barang di keranjang`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

function Logo({ logoUrl, storeName, logoContainsStoreName }: { logoUrl: string | null; storeName: string; logoContainsStoreName: boolean }) {
  return (
    <Link href="/" className="flex min-h-[40px] shrink-0 items-center gap-2" aria-label={`${storeName} — ke beranda`}>
      {logoUrl ? (
        <span className={cn('relative grid shrink-0 place-items-center overflow-hidden rounded-lg', logoContainsStoreName ? 'h-9 w-auto max-w-[110px] sm:max-w-[170px]' : 'h-9 w-9')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt={logoContainsStoreName ? storeName : ''} className={cn('h-full w-full', logoContainsStoreName ? 'object-contain' : 'object-cover')} />
        </span>
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-600 text-base font-extrabold text-white">{storeName.charAt(0).toUpperCase()}</span>
      )}
      {!logoContainsStoreName && (
        <span className="hidden max-w-[180px] truncate text-lg font-extrabold tracking-tight text-brand-700 sm:block">{storeName}</span>
      )}
    </Link>
  )
}

export function StoreHeader({ logoUrl, storeName, logoContainsStoreName }: { logoUrl: string | null; storeName: string; logoContainsStoreName: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const [q, setQ] = useState('')
  useEffect(() => {
    if (!pathname.startsWith('/search')) setQ('')
  }, [pathname])

  return (
    <header className="sticky top-0 z-40 bg-white pt-[var(--safe-t)] shadow-[0_1px_0_rgba(17,24,39,.06),0_2px_8px_rgba(17,24,39,.04)]">
      {/* Strip info (desktop) */}
      <div className="hidden border-b border-line bg-cream-50 lg:block">
        <div className="page flex h-8 items-center justify-between text-[12px] text-ink-muted">
          <span className="flex items-center gap-1.5">
            <Truck size={14} className="text-brand-600" /> Belanja kebutuhan harian, diantar langsung ke rumah
          </span>
          <nav className="flex items-center gap-5" aria-label="Tautan bantuan">
            <InstallButton className="!h-auto !gap-1 !rounded-none !bg-transparent !p-0 !text-[12px] !font-semibold !text-ink-muted !shadow-none hover:!text-brand-700 [&_svg]:h-3.5 [&_svg]:w-3.5" />
            <Link href="/orders" className="hover:text-brand-700">Lacak pesanan</Link>
            <Link href="/support" className="hover:text-brand-700">Bantuan</Link>
          </nav>
        </div>
      </div>

      <div className="page flex h-14 items-center gap-3 lg:h-[68px] lg:gap-6">
        <Logo logoUrl={logoUrl} storeName={storeName} logoContainsStoreName={logoContainsStoreName} />

        <Link
          href="/kategori"
          className={cn(
            'hidden items-center gap-1.5 rounded-lg px-3 py-2 text-[14px] font-semibold text-ink-soft hover:bg-cream-100 lg:inline-flex',
            pathname.startsWith('/kategori') && 'text-brand-700',
          )}
        >
          <LayoutGrid size={18} /> Kategori
        </Link>

        {/* Pencarian: HP berupa tautan ke /search, desktop form langsung */}
        <Link
          href="/search"
          className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-cream-300 bg-white px-3 text-[14px] text-ink-faint md:hidden"
          aria-label="Cari produk"
        >
          <Search size={18} className="shrink-0" />
          <span className="truncate">Cari di {storeName}</span>
        </Link>
        <form
          role="search"
          className="hidden min-w-0 flex-1 md:block"
          onSubmit={(e) => {
            e.preventDefault()
            if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`)
          }}
        >
          <label className="relative flex">
            <span className="sr-only">Cari produk</span>
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              enterKeyHint="search"
              className="h-10 w-full rounded-l-lg border border-r-0 border-cream-300 bg-white pl-10 pr-3 text-[14px] text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none"
              placeholder="Cari sayur, buah, telur, beras..."
            />
            <button type="submit" className="h-10 shrink-0 rounded-r-lg bg-brand-600 px-5 text-[14px] font-bold text-white hover:bg-brand-700">
              Cari
            </button>
          </label>
        </form>

        <div className="flex shrink-0 items-center gap-0.5 lg:gap-2">
          <Link href="/cart" className="relative grid h-10 w-10 place-items-center rounded-lg text-ink-soft hover:bg-cream-100" aria-label="Buka keranjang">
            <ShoppingCart size={22} />
            <CartBadge className="right-0 top-0" />
          </Link>
          <span className="mx-1 hidden h-6 w-px bg-line lg:block" aria-hidden />
          <Link
            href="/orders"
            className={cn('hidden h-10 items-center gap-1.5 rounded-lg px-3 text-[14px] font-semibold text-ink-soft hover:bg-cream-100 lg:inline-flex', pathname.startsWith('/orders') && 'text-brand-700')}
          >
            <Package size={19} /> Pesanan
          </Link>
          <Link
            href="/account"
            className={cn('hidden h-10 items-center gap-1.5 rounded-lg px-3 text-[14px] font-semibold text-ink-soft hover:bg-cream-100 sm:inline-flex', pathname.startsWith('/account') && 'text-brand-700')}
            aria-label="Akun saya"
          >
            <User size={19} /> <span className="hidden lg:inline">Akun</span>
          </Link>
          <Link href="/support" className="hidden h-10 w-10 place-items-center rounded-lg text-ink-soft hover:bg-cream-100 sm:grid lg:hidden" aria-label="Bantuan">
            <HelpCircle size={21} />
          </Link>
        </div>
      </div>
    </header>
  )
}

const NAV = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/kategori', label: 'Kategori', icon: Grid2x2 },
  { href: '/cart', label: 'Keranjang', icon: ShoppingCart },
  { href: '/orders', label: 'Pesanan', icon: Package },
  { href: '/account', label: 'Akun', icon: User },
] as const

/** Halaman yang punya bar aksi sendiri di bawah layar: menu bawah disembunyikan. */
export function hidesBottomNav(pathname: string) {
  return pathname.startsWith('/products/') || pathname.startsWith('/cart') || pathname.startsWith('/checkout')
}

export function BottomNav() {
  const pathname = usePathname()
  if (hidesBottomNav(pathname)) return null
  return (
    <nav aria-label="Menu bawah" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white pb-[var(--safe-b)] shadow-nav lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn('relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition', active ? 'text-brand-600' : 'text-ink-muted')}
              >
                {active && <span className="absolute inset-x-5 top-0 h-0.5 rounded-b bg-brand-600" aria-hidden />}
                <span className="relative">
                  <Icon size={22} strokeWidth={active ? 2.4 : 1.9} />
                  {href === '/cart' && <CartBadge className="-right-2.5 -top-1.5" />}
                </span>
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
