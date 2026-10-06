'use client'

import { BellRing } from 'lucide-react'
import { PushToggle } from '@/components/admin/push-toggle'

export function AdminPushReminder() {
  return (
    <section className="rounded-2xl border border-brand-200 bg-brand-50 p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-700">
          <BellRing size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-extrabold text-ink">Aktifkan notifikasi pesanan</h2>
          <p className="mt-1 text-sm text-ink-muted">Agar HP admin mendapat notifikasi saat ada pesanan baru atau bukti pembayaran masuk.</p>
          <div className="mt-3">
            <PushToggle />
          </div>
        </div>
      </div>
    </section>
  )
}
