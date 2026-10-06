import type { Metadata } from 'next'
import { Legal } from '@/components/legal'

export const metadata: Metadata = { title: 'Syarat Layanan' }

export default function TermsPage() {
  return (
    <Legal title="Syarat Layanan" updated="Oktober 2026">
      <section>
        <h2>Pemesanan</h2>
        <p>Pesanan dianggap masuk setelah kamu menekan Buat pesanan dan nomor pesanan muncul. Toko berhak membatalkan pesanan jika stok bermasalah atau data pengantaran tidak lengkap, dan akan memberi tahu alasannya.</p>
      </section>
      <section>
        <h2>Harga dan stok</h2>
        <p>Harga dan stok dapat berubah sewaktu-waktu. Total yang kamu bayar dihitung oleh sistem saat pesanan dibuat, bukan dari tampilan di perangkatmu.</p>
      </section>
      <section>
        <h2>Pembayaran</h2>
        <ul>
          <li>QRIS dan transfer bank: pesanan diproses setelah pembayaran diverifikasi toko.</li>
          <li>COD: bayar tunai kepada kurir saat pesanan diterima.</li>
          <li>Pastikan nominal sesuai total pesanan dan kirim bukti pembayaran yang jelas.</li>
        </ul>
      </section>
      <section>
        <h2>Pengantaran</h2>
        <p>Pengantaran dilakukan oleh toko ke area yang tersedia. Ongkos kirim mengikuti area yang kamu pilih. Pastikan alamat dan nomor HP benar agar kurir dapat menghubungimu.</p>
      </section>
      <section>
        <h2>Pembatalan dan masalah pesanan</h2>
        <p>Hubungi toko sesegera mungkin lewat halaman Bantuan jika ingin membatalkan atau ada barang yang tidak sesuai. Untuk produk segar, laporkan maksimal pada hari barang diterima.</p>
      </section>
      <section>
        <h2>Keamanan akun</h2>
        <p>Kami tidak pernah meminta PIN, OTP, atau password bank. Jaga kerahasiaan nomor HP dan password akunmu.</p>
      </section>
    </Legal>
  )
}
