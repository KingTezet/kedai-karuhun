import Link from 'next/link'
import { MapPin, MessageCircle, Clock } from 'lucide-react'
import type { StoreSettings } from '@/types'
import { waLink } from '@/lib/utils'

export function StoreFooter({ settings }: { settings: StoreSettings | null }) {
  const name = settings?.store_name || 'Kedai Karuhun'
  return (
    <footer className="mt-10 hidden border-t border-line bg-white lg:block">
      <div className="page grid gap-8 py-10 md:grid-cols-3">
        <div>
          <p className="text-lg font-extrabold text-brand-700">{name}</p>
          <p className="mt-2 text-sm text-ink-muted">Belanja kebutuhan harian dari toko di sekitarmu, diantar sampai rumah.</p>
        </div>
        <ul className="space-y-2 text-sm text-ink-soft">
          {settings?.address && (
            <li className="flex gap-2">
              <MapPin size={18} className="mt-0.5 shrink-0 text-brand-600" /> {settings.address}
            </li>
          )}
          {settings?.open_hours && (
            <li className="flex gap-2">
              <Clock size={18} className="mt-0.5 shrink-0 text-brand-600" /> {settings.open_hours}
            </li>
          )}
          {settings?.whatsapp && (
            <li className="flex gap-2">
              <MessageCircle size={18} className="mt-0.5 shrink-0 text-brand-600" />
              <a className="font-semibold text-brand-700 underline" href={waLink(settings.whatsapp, 'Halo, saya mau tanya soal pesanan.')} target="_blank" rel="noreferrer">
                Chat WhatsApp
              </a>
            </li>
          )}
        </ul>
        <ul className="space-y-2 text-sm font-semibold text-ink-soft">
          <li><Link href="/support" className="hover:text-brand-700">Bantuan</Link></li>
          <li><Link href="/privacy" className="hover:text-brand-700">Kebijakan privasi</Link></li>
          <li><Link href="/terms" className="hover:text-brand-700">Syarat layanan</Link></li>
        </ul>
      </div>
    </footer>
  )
}
