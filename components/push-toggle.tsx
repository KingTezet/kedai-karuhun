'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'
import { useToast } from '@/lib/toast'
import { Spinner } from '@/components/ui'

function b64ToUint8(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

type Audience = 'staff' | 'customer'

export function PushToggle({ audience = 'customer' }: { audience?: Audience }) {
  const toast = useToast()
  const [state, setState] = useState<'checking' | 'unsupported' | 'off' | 'on' | 'denied' | 'needs-install'>('checking')
  const [busy, setBusy] = useState(false)
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (!key || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return setState('unsupported')
    if (ios && !standalone) return setState('needs-install')
    if (Notification.permission === 'denied') return setState('denied')
    navigator.serviceWorker.ready
      .then(async (r) => {
        await r.update().catch(() => {})
        return r.pushManager.getSubscription()
      })
      .then(async (s) => {
        if (!s) {
          setState('off')
          return
        }
        const json = s.toJSON()
        if (!json.endpoint || !json.keys) throw new Error('Invalid push subscription')
        const sync = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, user_agent: navigator.userAgent.slice(0, 300) }),
        })
        if (!sync.ok) throw new Error('Subscription sync failed')
        setState('on')
      })
      .catch(() => setState('unsupported'))
  }, [key])

  if (state === 'checking' || state === 'unsupported') return null

  const enable = async () => {
    setBusy(true)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        setState('denied')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const current = await reg.pushManager.getSubscription()
      const sub = current ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(key!) })
      const json = sub.toJSON()
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, user_agent: navigator.userAgent.slice(0, 300) }),
      })
      if (!res.ok) throw new Error()
      setState('on')
      toast.success('Notifikasi aktif', {
        description: audience === 'staff' ? 'Pesanan dan aktivitas toko akan dikirim ke perangkat ini.' : 'Promo dan informasi pesanan akan dikirim ke perangkat ini.',
      })
    } catch {
      toast.error('Gagal mengaktifkan notifikasi')
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub?.endpoint) {
        const res = await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        if (!res.ok) throw new Error()
        await sub.unsubscribe().catch(() => false)
      }
      setState('off')
      toast.info('Notifikasi dimatikan')
    } catch {
      toast.error('Gagal mematikan notifikasi')
    } finally {
      setBusy(false)
    }
  }

  if (state === 'needs-install') {
    return <div className="rounded-xl bg-cream-100 p-3 text-[14px] text-ink-muted"><span className="flex items-start gap-2"><Bell size={18} className="mt-0.5 shrink-0 text-brand-600" /><span><b className="text-ink">Pasang aplikasi dulu.</b> Di iPhone/iPad, tambahkan toko ke Home Screen lalu buka dari ikon itu untuk mengaktifkan notifikasi.</span></span></div>
  }
  if (state === 'denied') {
    return <div className="rounded-xl bg-amber-50 p-3 text-[14px] text-amber-900"><span className="flex items-start gap-2"><BellOff size={18} className="mt-0.5 shrink-0" /><span>Notifikasi diblokir. Izinkan notifikasi untuk situs/aplikasi ini lewat pengaturan browser/perangkat.</span></span></div>
  }
  if (state === 'on') {
    return <div className="flex items-center gap-2 rounded-xl bg-brand-50 p-3 text-[14px] font-semibold text-brand-800"><BellRing size={18} /><span className="flex-1">Notifikasi aktif di perangkat ini</span><button type="button" onClick={disable} disabled={busy} className="text-xs font-extrabold underline">{busy ? '...' : 'Matikan'}</button></div>
  }
  return (
    <button type="button" onClick={enable} disabled={busy} className="btn-soft w-full">
      {busy ? <Spinner /> : <BellRing size={18} />} Aktifkan notifikasi
    </button>
  )
}
