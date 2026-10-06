'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Grid2x2, Home, Package, Search, ShoppingCart, User } from 'lucide-react'
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
        'absolute grid h-5 min-w-5 animate-bump place-items-center rounded-full bg-accent-500 px-1 text-[11px] font-extrabold leading-none text-white ring-2 ring-white',
        className,
      )}
      aria-label={`${count} jenis barang di keranjang`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

export function StoreHeader({ logoUrl, storeName, logoContainsStoreName }: { logoUrl: string | null; storeName: string; logoContainsStoreName: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const [q, setQ] = useState('')
  const links = [
    { href: '/', label: 'Beranda' },
    { href: '/products', label: 'Belanja' },
    { href: '/kategori', label: 'Kategori' },
    { href: '/orders', label: 'Pesanan' },
  ]
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white pt-[var(--safe-t)] shadow-card">
      <div className="page flex h-16 items-center gap-3">
        <Link href="/" className="flex min-h-[44px] shrink-0 items-center gap-2.5" aria-label={`${storeName} — ke beranda`}>
          {logoUrl ? (
            <span className={cn('relative grid shrink-0 place-items-center overflow-hidden rounded-xl bg-cream-100', logoContainsStoreName ? 'h-10 w-auto max-w-[200px]' : 'h-10 w-10')}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt={logoContainsStoreName ? storeName : ''} className={cn('h-full w-full', logoContainsStoreName ? 'object-contain' : 'object-cover')} />
            </span>
          ) : (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-lg font-extrabold text-white">K</span>
          )}
          {!logoContainsStoreName && <span className="max-w-[180px] truncate text-[17px] font-extrabold tracking-tight sm:text-lg">{storeName}</span>}
        </Link>

        <form
          role="search"
          className="mx-4 hidden max-w-md flex-1 md:block"
          onSubmit={(e) => {
            e.preventDefault()
            if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`)
          }}
        >
          <label className="relative block">
            <span className="sr-only">Cari produk</span>
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="input min-h-[44px] pl-10" placeholder="Cari sayur, buah, telur..." />
          </label>
        </form>

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Menu utama">
          {links.map((l) => {
            const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href)
            return (
              <Link key={l.href} href={l.href} className={cn('btn-ghost', active && 'bg-brand-50 text-brand-700')}>
                {l.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <InstallButton className="mr-1" />
          <Link href="/search" className="grid h-11 w-11 place-items-center rounded-xl text-ink-soft hover:bg-cream-200 md:hidden" aria-label="Cari produk">
            <Search size={22} />
          </Link>
          <Link href="/cart" className="relative grid h-11 w-11 place-items-center rounded-xl text-ink-soft hover:bg-cream-200" aria-label="Buka keranjang">
            <ShoppingCart size={23} />
            <CartBadge className="-right-0.5 -top-0.5" />
          </Link>
          <Link href="/account" className="hidden h-11 w-11 place-items-center rounded-xl text-ink-soft hover:bg-cream-200 sm:grid" aria-label="Akun saya">
            <User size={23} />
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

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Menu bawah"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white pb-[var(--safe-b)] shadow-nav lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-16 flex-col items-center justify-center gap-0.5 text-[12px] font-semibold transition',
                  active ? 'text-brand-700' : 'text-ink-muted',
                )}
              >
                <span className={cn('relative grid h-8 w-14 place-items-center rounded-full transition', active && 'bg-brand-100')}>
                  <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                  {href === '/cart' && <CartBadge className="-right-0.5 -top-1" />}
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
