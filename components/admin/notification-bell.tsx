'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, BellRing, CheckCheck, Package, Wallet, TriangleAlert } from 'lucide-react'
import type { AppNotification } from '@/types'
import { timeAgo, cn } from '@/lib/utils'
import { Sheet } from '@/components/sheet'
import { useToast } from '@/lib/toast'
import { PushToggle } from '@/components/admin/push-toggle'

const ICON: Record<string, typeof Bell> = { new_order: Package, payment_proof: Wallet, low_stock: TriangleAlert }

export function NotificationBell() {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [loaded, setLoaded] = useState(false)
  const lastTop = useRef<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications', { cache: 'no-store' })
      const json = await res.json()
      if (json.ok) {
        const list = json.items as AppNotification[]
        setItems(list)
        setLoaded(true)
        const top = list.find((n) => !n.read_at)
        if (lastTop.current && top && top.id !== lastTop.current) {
          toast.info(top.title, { description: top.body, action: top.href ? { label: 'Buka', href: top.href } : undefined })
        }
        lastTop.current = top?.id ?? lastTop.current
      }
    } catch {}
  }, [toast])

  useEffect(() => {
    load()
    const t = setInterval(() => document.visibilityState === 'visible' && load(), 30000)
    return () => clearInterval(t)
  }, [load])

  const unread = items.filter((n) => !n.read_at).length

  const markAll = async () => {
    setItems((xs) => xs.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })))
    await fetch('/api/admin/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) })
  }

  return (
    <>
      <button onClick={() => { setOpen(true); load() }} className="relative grid h-11 w-11 place-items-center rounded-xl text-ink-soft hover:bg-cream-200" aria-label={unread ? `${unread} notifikasi belum dibaca` : 'Notifikasi'}>
        {unread > 0 ? <BellRing size={22} /> : <Bell size={22} />}
        {unread > 0 && <span className="absolute right-0.5 top-0.5 grid h-5 min-w-5 animate-pop place-items-center rounded-full bg-accent-500 px-1 text-[11px] font-extrabold text-white ring-2 ring-white">{unread > 9 ? '9+' : unread}</span>}
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Notifikasi"
        footer={unread > 0 ? <button onClick={markAll} className="btn-secondary w-full"><CheckCheck size={18} /> Tandai semua dibaca</button> : undefined}
      >
        <PushToggle />
        {!loaded ? (
          <p className="py-8 text-center text-ink-muted">Memuat...</p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-ink-muted">Belum ada notifikasi.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {items.map((n) => {
              const Icon = ICON[n.type] ?? Bell
              const body = (
                <div className={cn('flex gap-3 py-3', !n.read_at && 'font-semibold')}>
                  <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', n.read_at ? 'bg-cream-200 text-ink-muted' : 'bg-accent-100 text-accent-700')}><Icon size={20} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px]">{n.title}</span>
                    <span className="block text-[13px] font-normal text-ink-muted">{n.body}</span>
                    <span className="block text-xs font-normal text-ink-faint">{timeAgo(n.created_at)}</span>
                  </span>
                  {!n.read_at && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-500" aria-label="Belum dibaca" />}
                </div>
              )
              return (
                <li key={n.id}>
                  {n.href ? (
                    <Link
                      href={n.href}
                      onClick={() => {
                        setOpen(false)
                        fetch('/api/admin/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: n.id }) })
                        setItems((xs) => xs.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)))
                      }}
                    >
                      {body}
                    </Link>
                  ) : body}
                </li>
              )
            })}
          </ul>
        )}
      </Sheet>
    </>
  )
}
