'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, BellRing, CheckCheck, Megaphone } from 'lucide-react'
import { useToast } from '@/lib/toast'
import { timeAgo, cn } from '@/lib/utils'
import { PushToggle } from '@/components/push-toggle'
import type { AppNotification } from '@/types'
import Link from 'next/link'

export function CustomerNotifications() {
  const toast = useToast()
  const [items, setItems] = useState<AppNotification[]>([])
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (res.status === 401) return
      const json = await res.json()
      if (json.ok) setItems((json.items ?? []) as AppNotification[])
    } catch {} finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const unread = items.filter((x) => !x.read_at).length
  const markAll = async () => {
    setItems((xs) => xs.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })))
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) })
    toast.success('Semua notifikasi ditandai sudah dibaca')
  }

  const markOne = async (id: string) => {
    setItems((xs) => xs.map((x) => x.id === id ? { ...x, read_at: new Date().toISOString() } : x))
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
  }

  return (
    <section className="card p-4 sm:p-5" aria-labelledby="notifikasi">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><BellRing size={22} /></span>
        <div className="min-w-0 flex-1">
          <h2 id="notifikasi" className="text-lg font-bold">Notifikasi</h2>
          <p className="mt-0.5 text-[14px] text-ink-muted">Dapatkan update pesanan, promo, dan info terbaru dari toko.</p>
        </div>
        {unread > 0 && <span className="badge bg-brand-600 text-white">{unread} baru</span>}
      </div>
      <div className="mt-4"><PushToggle audience="customer" /></div>
      {!loaded ? (
        <p className="mt-4 text-sm text-ink-muted">Memuat notifikasi...</p>
      ) : items.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-cream-100 p-4 text-sm text-ink-muted">Belum ada notifikasi dari toko.</div>
      ) : (
        <div className="mt-4">
          {unread > 0 && <button onClick={markAll} className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-brand-700"><CheckCheck size={17} /> Tandai semua dibaca</button>}
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white overflow-hidden">
            {items.map((n) => {
              const content = (
                <div className={cn('flex gap-3 p-4', !n.read_at && 'bg-brand-50/40')}>
                  <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', n.type.startsWith('broadcast') ? 'bg-accent-100 text-accent-700' : 'bg-brand-50 text-brand-700')}>
                    {n.type.startsWith('broadcast') ? <Megaphone size={19} /> : <Bell size={19} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{n.title}</p>
                    <p className="mt-0.5 text-[14px] text-ink-muted">{n.body}</p>
                    <p className="mt-1 text-xs text-ink-faint">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read_at && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-500" />}
                </div>
              )
              return <li key={n.id} onClick={() => { if (!n.read_at) void markOne(n.id) }}>{n.href ? <Link href={n.href}>{content}</Link> : content}</li>
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
