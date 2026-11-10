'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Boxes, ChevronRight, ClipboardList, Ellipsis, ExternalLink, LayoutDashboard, LogOut, Megaphone, Package, Settings, Store, Tags, Users, Wallet } from 'lucide-react'
import type { Role } from '@/types'
import { can } from '@/lib/permissions'
import { ROLE_LABEL } from '@/lib/status'
import { cn } from '@/lib/utils'
import { Sheet } from '@/components/sheet'
import { NotificationBell } from '@/components/admin/notification-bell'
import { AdminFocusGuard } from '@/components/admin/focus-guard'

type Item = { href: string; label: string; icon: typeof Package; show: boolean; badge?: number; group: string }

const GROUPS = ['Utama', 'Katalog', 'Bisnis', 'Toko']

function Brand({ storeName, logoUrl, size = 36 }: { storeName: string; logoUrl: string | null; size?: number }) {
  return logoUrl ? (
    <span className="relative grid shrink-0 place-items-center overflow-hidden rounded-lg bg-cream-100" style={{ width: size, height: size }}>
      <Image src={logoUrl} alt="" fill sizes={`${size}px`} className="object-cover" />
    </span>
  ) : (
    <span className="grid shrink-0 place-items-center rounded-lg bg-brand-600 font-extrabold text-white" style={{ width: size, height: size }}>
      {storeName.charAt(0).toUpperCase() || 'K'}
    </span>
  )
}

function CountBadge({ n, inverted }: { n: number; inverted?: boolean }) {
  return (
    <span className={cn('grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold', inverted ? 'bg-white text-brand-700' : 'bg-sale-500 text-white')}>
      {n > 99 ? '99+' : n}
    </span>
  )
}

export function AdminShell({
  role,
  name,
  storeName,
  logoUrl,
  counts,
  children,
}: {
  role: Role
  name: string
  storeName: string
  logoUrl: string | null
  counts: { orders: number; lowStock: number }
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [more, setMore] = useState(false)

  const items: Item[] = [
    { href: '/admin', label: 'Ringkasan', icon: LayoutDashboard, show: true, group: 'Utama' },
    { href: '/admin/orders', label: 'Pesanan', icon: ClipboardList, show: can.processOrders(role), badge: counts.orders, group: 'Utama' },
    { href: '/admin/inventory', label: 'Stok', icon: Boxes, show: can.manageStock(role), badge: counts.lowStock, group: 'Katalog' },
    { href: '/admin/products', label: 'Produk', icon: Package, show: can.manageProducts(role), group: 'Katalog' },
    { href: '/admin/categories', label: 'Kategori', icon: Tags, show: can.manageProducts(role), group: 'Katalog' },
    { href: '/admin/finance', label: 'Keuangan', icon: Wallet, show: can.viewFinance(role), group: 'Bisnis' },
    { href: '/admin/users', label: 'Pengguna', icon: Users, show: can.viewUsers(role), group: 'Bisnis' },
    { href: '/admin/notifications', label: 'Notifikasi', icon: Megaphone, show: can.manageSettings(role), group: 'Toko' },
    { href: '/admin/settings', label: 'Pengaturan', icon: Settings, show: can.manageSettings(role), group: 'Toko' },
  ].filter((i) => i.show)

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href))
  const primary = items.slice(0, 4)
  const rest = items.slice(4)
  const current = items.find((i) => isActive(i.href))
  const initial = name.trim().charAt(0).toUpperCase() || 'A'

  return (
    <div className="min-h-[100dvh] bg-cream-100 lg:flex">
      <AdminFocusGuard />

      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-[100dvh] w-[248px] shrink-0 flex-col border-r border-line bg-white lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
          <Brand storeName={storeName} logoUrl={logoUrl} />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[15px] font-extrabold">{storeName}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">Seller Center</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menu admin">
          {GROUPS.map((g) => {
            const list = items.filter((i) => i.group === g)
            if (!list.length) return null
            return (
              <div key={g} className="mb-4">
                <p className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-ink-faint">{g}</p>
                <ul className="space-y-0.5">
                  {list.map(({ href, label, icon: Icon, badge }) => {
                    const on = isActive(href)
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          aria-current={on ? 'page' : undefined}
                          className={cn(
                            'relative flex min-h-[40px] items-center gap-3 rounded-lg px-3 text-[14px] font-semibold transition',
                            on ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-cream-100 hover:text-ink',
                          )}
                        >
                          {on && <span className="absolute -left-3 top-1.5 bottom-1.5 w-1 rounded-r bg-brand-600" aria-hidden />}
                          <Icon size={18} className={on ? 'text-brand-600' : 'text-ink-muted'} />
                          <span className="flex-1">{label}</span>
                          {!!badge && <CountBadge n={badge} />}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2.5 rounded-lg bg-cream-50 p-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-[14px] font-extrabold text-white">{initial}</span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-bold">{name}</p>
              <p className="text-[11px] text-ink-muted">{ROLE_LABEL[role]}</p>
            </div>
            <form action="/api/auth/logout" method="post">
              <button className="grid h-8 w-8 place-items-center rounded-md text-ink-muted hover:bg-red-50 hover:text-red-700" aria-label="Keluar" title="Keluar">
                <LogOut size={17} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-line bg-white pt-[var(--safe-t)]">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <span className="lg:hidden"><Brand storeName={storeName} logoUrl={logoUrl} size={34} /></span>
            <div className="min-w-0 flex-1">
              <p className="hidden items-center gap-1 text-[12px] text-ink-muted lg:flex">
                Seller Center <ChevronRight size={12} /> <span className="text-ink-soft">{current?.group ?? 'Utama'}</span>
              </p>
              <h1 className="truncate text-[17px] font-extrabold leading-tight lg:text-lg">{current?.label ?? 'Admin'}</h1>
            </div>
            <NotificationBell />
            <Link href="/" className="hidden h-10 items-center gap-1.5 rounded-lg border border-cream-300 px-3 text-[13px] font-bold text-ink-soft hover:border-brand-400 hover:text-brand-700 sm:inline-flex">
              <ExternalLink size={15} /> Lihat toko
            </Link>
            <Link href="/" className="grid h-10 w-10 place-items-center rounded-lg text-ink-soft hover:bg-cream-100 sm:hidden" aria-label="Lihat toko">
              <Store size={21} />
            </Link>
          </div>
        </header>
        <main className="px-4 pb-[calc(var(--nav-h)+var(--safe-b)+24px)] pt-4 sm:px-6 sm:pt-6 lg:pb-10">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Menu bawah (HP) */}
      <nav aria-label="Menu bawah admin" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white pb-[var(--safe-b)] shadow-nav lg:hidden">
        <ul className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${primary.length + 1}, minmax(0, 1fr))` }}>
          {primary.map(({ href, label, icon: Icon, badge }) => {
            const on = isActive(href)
            return (
              <li key={href}>
                <Link href={href} aria-current={on ? 'page' : undefined} className={cn('relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold', on ? 'text-brand-600' : 'text-ink-muted')}>
                  {on && <span className="absolute inset-x-5 top-0 h-0.5 rounded-b bg-brand-600" aria-hidden />}
                  <span className="relative">
                    <Icon size={22} strokeWidth={on ? 2.4 : 1.9} />
                    {!!badge && <span className="absolute -right-3 -top-1.5"><CountBadge n={badge} /></span>}
                  </span>
                  {label}
                </Link>
              </li>
            )
          })}
          <li>
            <button onClick={() => setMore(true)} className={cn('flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold', rest.some((r) => isActive(r.href)) ? 'text-brand-600' : 'text-ink-muted')}>
              <Ellipsis size={22} />
              Lainnya
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={more} onClose={() => setMore(false)} title="Menu lainnya">
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-cream-50 p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 font-extrabold text-white">{initial}</span>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-bold">{name}</p>
            <p className="text-[12px] text-ink-muted">{ROLE_LABEL[role]}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[...rest, { href: '/', label: 'Lihat toko', icon: Store }].map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMore(false)} className="flex flex-col items-center gap-2 rounded-xl border border-line p-3 text-center text-[12px] font-bold hover:border-brand-300">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-600"><Icon size={20} /></span>
              {label}
            </Link>
          ))}
        </div>
        <form action="/api/auth/logout" method="post" className="mt-4">
          <button className="btn-danger-soft w-full"><LogOut size={18} /> Keluar</button>
        </form>
      </Sheet>
    </div>
  )
}
