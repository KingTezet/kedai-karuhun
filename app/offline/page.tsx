import { WifiOff } from 'lucide-react'

export const metadata = { title: 'Tidak ada koneksi' }

export default function OfflinePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-cream-100 px-6 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-full bg-cream-200 text-ink-muted"><WifiOff size={36} /></span>
      <h1 className="mt-5 text-2xl font-extrabold">Tidak ada koneksi internet</h1>
      <p className="mt-2 max-w-sm text-ink-muted">Periksa sinyal atau Wi-Fi kamu, lalu coba lagi. Keranjang belanjamu tetap aman di HP ini.</p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="btn-primary btn-lg mt-6">Coba lagi</a>
    </div>
  )
}
