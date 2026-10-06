'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Boxes, ClipboardList, LayoutDashboard, LogOut, Package, Settings, Store, Tags, Users, Wallet, Ellipsis, Megaphone } from 'lucide-react'
import type { Role } from '@/types'
import { can } from '@/lib/permissions'
import { ROLE_LABEL } from '@/lib/status'
import { cn } from '@/lib/utils'
import { Sheet } from '@/components/sheet'
import { NotificationBell } from '@/components/admin/notification-bell'
import { AdminFocusGuard } from '@/components/admin/focus-guard'

type Item = { href: string; label: string; icon: typeof Package; show: boolean; badge?: number }

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
    { href: '/admin', label: 'Ringkasan', icon: LayoutDashboard, show: true },
    { href: '/admin/orders', label: 'Pesanan', icon: ClipboardList, show: can.processOrders(role), badge: counts.orders },
    { href: '/admin/inventory', label: 'Stok', icon: Boxes, show: can.manageStock(role), badge: counts.lowStock },
    { href: '/admin/products', label: 'Produk', icon: Package, show: can.manageProducts(role) },
    { href: '/admin/categories', label: 'Kategori', icon: Tags, show: can.manageProducts(role) },
    { href: '/admin/finance', label: 'Keuangan', icon: Wallet, show: can.viewFinance(role) },
    { href: '/admin/users', label: 'Pengguna', icon: Users, show: can.viewUsers(role) },
    { href: '/admin/notifications', label: 'Notifikasi', icon: Megaphone, show: can.manageSettings(role) },
    { href: '/admin/settings', label: 'Pengaturan', icon: Settings, show: can.manageSettings(role) },
  ].filter((i) => i.show)

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href))
  const primary = items.slice(0, 4)
  const rest = items.slice(4)
  const current = items.find((i) => isActive(i.href))

  return (
    <div className="min-h-[100dvh] bg-cream-100 lg:flex">
      <AdminFocusGuard />
      {/* sidebar desktop */}
      <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-line bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-line px-5">
          {logoUrl ? <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-cream-100"><Image src={logoUrl} alt="" fill sizes="36px" className="object-cover" /></span> : <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 font-extrabold text-white">{storeName.charAt(0).toUpperCase() || 'K'}</span>}
          <div className="leading-tight">
            <p className="font-extrabold">{storeName}</p>
            <p className="text-xs text-ink-muted">Panel toko</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Menu admin">
          {items.map(({ href, label, icon: Icon, badge }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={cn('flex min-h-[46px] items-center gap-3 rounded-xl px-3 font-semibold transition', isActive(href) ? 'bg-brand-600 text-white' : 'text-ink-soft hover:bg-cream-200')}
            >
              <Icon size={20} />
              <span className="flex-1">{label}</span>
              {!!badge && <span className={cn('grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-bold', isActive(href) ? 'bg-white text-brand-700' : 'bg-accent-500 text-white')}>{badge}</span>}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-line p-3">
          <Link href="/" className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 font-semibold text-ink-soft hover:bg-cream-200"><Store size={20} /> Lihat toko</Link>
          <form action="/api/auth/logout" method="post">
            <button className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 font-semibold text-red-700 hover:bg-red-50"><LogOut size={20} /> Keluar</button>
          </form>
          <p className="px-3 pt-1 text-xs text-ink-muted">{name} · {ROLE_LABEL[role]}</p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-white px-4 pt-[var(--safe-t)] shadow-card sm:px-6">
          {logoUrl ? <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-cream-100 lg:hidden"><Image src={logoUrl} alt="" fill sizes="36px" className="object-cover" /></span> : null}<h1 className="min-w-0 flex-1 truncate text-lg font-extrabold">{current?.label ?? 'Admin'}</h1>
          <NotificationBell />
          <Link href="/" className="grid h-11 w-11 place-items-center rounded-xl text-ink-soft hover:bg-cream-200 lg:hidden" aria-label="Lihat toko"><Store size={22} /></Link>
        </header>
        <main className="px-4 pb-[calc(var(--nav-h)+var(--safe-b)+24px)] pt-5 sm:px-6 lg:pb-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {/* menu bawah (HP) */}
      <nav aria-label="Menu bawah admin" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white pb-[var(--safe-b)] shadow-nav lg:hidden">
        <ul className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${primary.length + 1}, minmax(0, 1fr))` }}>
          {primary.map(({ href, label, icon: Icon, badge }) => (
            <li key={href}>
              <Link href={href} aria-current={isActive(href) ? 'page' : undefined} className={cn('flex h-16 flex-col items-center justify-center gap-0.5 text-[12px] font-semibold', isActive(href) ? 'text-brand-700' : 'text-ink-muted')}>
                <span className={cn('relative grid h-8 w-14 place-items-center rounded-full', isActive(href) && 'bg-brand-100')}>
                  <Icon size={22} strokeWidth={isActive(href) ? 2.4 : 2} />
                  {!!badge && <span className="absolute -right-0.5 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[11px] font-extrabold text-white ring-2 ring-white">{badge > 99 ? '99+' : badge}</span>}
                </span>
                {label}
              </Link>
            </li>
          ))}
          <li>
            <button onClick={() => setMore(true)} className={cn('flex h-16 w-full flex-col items-center justify-center gap-0.5 text-[12px] font-semibold', rest.some((r) => isActive(r.href)) ? 'text-brand-700' : 'text-ink-muted')}>
              <span className={cn('grid h-8 w-14 place-items-center rounded-full', rest.some((r) => isActive(r.href)) && 'bg-brand-100')}><Ellipsis size={22} /></span>
              Lainnya
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={more} onClose={() => setMore(false)} title="Menu lainnya">
        <div className="grid grid-cols-2 gap-3">
          {rest.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMore(false)} className="card flex min-h-[64px] items-center gap-3 p-3 font-bold">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon size={20} /></span> {label}
            </Link>
          ))}
          <Link href="/" onClick={() => setMore(false)} className="card flex min-h-[64px] items-center gap-3 p-3 font-bold">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Store size={20} /></span> Lihat toko
          </Link>
        </div>
        <form action="/api/auth/logout" method="post" className="mt-4">
          <button className="btn-danger-soft w-full"><LogOut size={18} /> Keluar</button>
        </form>
        <p className="mt-3 text-center text-xs text-ink-muted">{name} · {ROLE_LABEL[role]}</p>
      </Sheet>
    </div>
  )
}
