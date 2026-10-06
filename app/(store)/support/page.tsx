import type { Metadata } from 'next'
import { Clock, MapPin, MessageCircle } from 'lucide-react'
import { getSettings } from '@/lib/store'
import { waLink } from '@/lib/utils'
import { PageHeader } from '@/components/ui'

export const metadata: Metadata = { title: 'Bantuan', description: 'Pertanyaan umum dan kontak Kedai Karuhun.' }
export const revalidate = 300

const FAQ = [
  ['Bagaimana cara memesan?', 'Pilih produk, ketuk Tambah, buka Keranjang, lalu Checkout. Isi alamat, pilih area pengantaran dan cara bayar, lalu ketuk Buat pesanan.'],
  ['Apakah harus daftar dulu?', 'Tidak untuk melihat-lihat. Kamu baru diminta masuk saat checkout. Masuk cukup dengan nomor HP dan password.'],
  ['Cara bayar apa saja yang tersedia?', 'QRIS, transfer bank, dan bayar di tempat (COD). Untuk QRIS dan transfer, kirim bukti pembayaran di halaman pesanan supaya toko bisa memeriksanya.'],
  ['Kapan pesananku diantar?', 'Setelah toko mengonfirmasi dan menyiapkan pesananmu. Pantau tahapnya di menu Pesanan.'],
  ['Bukti pembayaran saya salah kirim, bagaimana?', 'Buka detail pesanan lalu kirim ulang bukti yang benar selama pembayaran belum diverifikasi.'],
  ['Apakah toko pernah meminta PIN atau OTP?', 'Tidak pernah. Jangan berikan PIN, OTP, atau password bank kepada siapa pun.'],
  ['Barang yang datang tidak sesuai?', 'Hubungi toko lewat WhatsApp dengan menyebut nomor pesanan, kami bantu secepatnya.'],
]

export default async function SupportPage() {
  const s = await getSettings()
  return (
    <div className="page max-w-3xl py-5 sm:py-8">
      <PageHeader title="Bantuan" subtitle="Jawaban cepat dan cara menghubungi kami" />

      <section className="card mb-6 space-y-3 p-4 sm:p-5">
        <h2 className="text-lg font-bold">Hubungi {s?.store_name || 'Kedai Karuhun'}</h2>
        {s?.whatsapp && (
          <a href={waLink(s.whatsapp, 'Halo, saya butuh bantuan.')} target="_blank" rel="noreferrer" className="btn-primary btn-lg w-full sm:w-auto">
            <MessageCircle size={20} /> Chat WhatsApp
          </a>
        )}
        {s?.open_hours && <p className="flex items-start gap-2 text-[15px]"><Clock size={20} className="mt-0.5 shrink-0 text-brand-600" /> {s.open_hours}</p>}
        {s?.address && <p className="flex items-start gap-2 text-[15px]"><MapPin size={20} className="mt-0.5 shrink-0 text-brand-600" /> {s.address}</p>}
        {!s?.whatsapp && !s?.address && <p className="text-[15px] text-ink-muted">Kontak toko sedang diperbarui.</p>}
      </section>

      <h2 className="section-title mb-3">Pertanyaan umum</h2>
      <div className="space-y-2">
        {FAQ.map(([q, a]) => (
          <details key={q} className="card group overflow-hidden">
            <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold marker:content-none">
              {q}
              <span aria-hidden className="text-xl text-brand-600 transition group-open:rotate-45">+</span>
            </summary>
            <p className="border-t border-line px-4 py-3 text-[15px] text-ink-soft">{a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
