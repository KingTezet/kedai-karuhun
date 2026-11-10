import Link from 'next/link'
import { Banknote, Clock, MapPin, MessageCircle, QrCode, Truck, Wallet } from 'lucide-react'
import type { StoreSettings } from '@/types'
import { waLink } from '@/lib/utils'

export function StoreFooter({ settings }: { settings: StoreSettings | null }) {
  const name = settings?.store_name || 'Kedai Karuhun'
  return (
    <footer className="mt-8 border-t border-line bg-white pb-[calc(var(--nav-h)+var(--safe-b))] lg:pb-0">
      <div className="page grid grid-cols-2 gap-x-6 gap-y-8 py-8 md:grid-cols-4 lg:py-10">
        <div className="col-span-2 md:col-span-1">
          <p className="text-lg font-extrabold text-brand-700">{name}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">Belanja kebutuhan harian dari toko di sekitarmu, diantar sampai rumah.</p>
        </div>

        <div>
          <h3 className="text-[14px] font-extrabold">Belanja</h3>
          <ul className="mt-3 space-y-2 text-[13px] text-ink-muted">
            <li><Link href="/products" className="hover:text-brand-700">Semua produk</Link></li>
            <li><Link href="/kategori" className="hover:text-brand-700">Kategori</Link></li>
            <li><Link href="/cart" className="hover:text-brand-700">Keranjang</Link></li>
            <li><Link href="/orders" className="hover:text-brand-700">Lacak pesanan</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-[14px] font-extrabold">Bantuan</h3>
          <ul className="mt-3 space-y-2 text-[13px] text-ink-muted">
            <li><Link href="/support" className="hover:text-brand-700">Pusat bantuan</Link></li>
            <li><Link href="/privacy" className="hover:text-brand-700">Kebijakan privasi</Link></li>
            <li><Link href="/terms" className="hover:text-brand-700">Syarat layanan</Link></li>
            <li><Link href="/account" className="hover:text-brand-700">Akun saya</Link></li>
          </ul>
        </div>

        <div className="col-span-2 md:col-span-1">
          <h3 className="text-[14px] font-extrabold">Hubungi toko</h3>
          <ul className="mt-3 space-y-2 text-[13px] text-ink-muted">
            {settings?.address && (
              <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-brand-600" /> {settings.address}</li>
            )}
            {settings?.open_hours && (
              <li className="flex gap-2"><Clock size={16} className="mt-0.5 shrink-0 text-brand-600" /> {settings.open_hours}</li>
            )}
            {settings?.whatsapp && (
              <li className="flex gap-2">
                <MessageCircle size={16} className="mt-0.5 shrink-0 text-brand-600" />
                <a className="font-bold text-brand-600 hover:text-brand-700" href={waLink(settings.whatsapp, 'Halo, saya mau tanya soal pesanan.')} target="_blank" rel="noreferrer">
                  Chat WhatsApp
                </a>
              </li>
            )}
          </ul>
          <p className="mt-4 text-[12px] font-bold text-ink-soft">Pembayaran & pengiriman</p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-ink-soft">
            <span className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1"><QrCode size={13} /> QRIS</span>
            <span className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1"><Banknote size={13} /> Transfer</span>
            <span className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1"><Wallet size={13} /> COD</span>
            <span className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1"><Truck size={13} /> Kurir toko</span>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="page py-4 text-center text-[12px] text-ink-faint">© {new Date().getFullYear()} {name}. Semua hak dilindungi.</p>
      </div>
    </footer>
  )
}
