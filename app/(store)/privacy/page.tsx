import type { Metadata } from 'next'
import { Legal } from '@/components/legal'

export const metadata: Metadata = { title: 'Kebijakan Privasi' }

export default function PrivacyPage() {
  return (
    <Legal title="Kebijakan Privasi" updated="Oktober 2026">
      <section>
        <h2>Data profil</h2>
        <p>Saat kamu masuk, kami menyimpan nomor HP, nama, dan data kontak yang diperlukan untuk pesanan. Data ini dipakai untuk mengenali akunmu, memproses pesanan, dan menghubungimu soal pengantaran.</p>
      </section>
      <section>
        <h2>Data pesanan</h2>
        <p>Kami menyimpan isi pesanan, harga saat dipesan, total bayar, metode pembayaran, status, dan catatan yang kamu tulis. Riwayat ini bisa kamu lihat di menu Pesanan dan dipakai toko untuk pembukuan.</p>
      </section>
      <section>
        <h2>Data alamat</h2>
        <p>Alamat yang kamu simpan hanya terlihat olehmu dan petugas toko yang memproses pesananmu. Setiap pesanan menyimpan salinan alamat saat itu, sehingga mengubah alamat tidak mengubah riwayat pesanan.</p>
      </section>
      <section>
        <h2>Bukti pembayaran</h2>
        <p>Bukti pembayaran disimpan secara privat. Hanya kamu sebagai pemilik pesanan dan petugas toko berwenang yang dapat membukanya, lewat tautan sementara. Jangan unggah data selain bukti bayar, dan kami tidak pernah meminta PIN, OTP, atau password bank.</p>
      </section>
      <section>
        <h2>Notifikasi</h2>
        <p>Petugas toko dapat mengaktifkan notifikasi push untuk pesanan baru, dan pelanggan dapat mengaktifkannya untuk menerima update pesanan, promo, dan informasi toko. Data langganan notifikasi (alamat endpoint perangkat) disimpan untuk pengiriman notifikasi tersebut dan dapat dimatikan kapan saja dari pengaturan akun/browser.</p>
      </section>
      <section>
        <h2>Penyimpanan di perangkatmu</h2>
        <p>Keranjang belanja dan pencarian terakhir disimpan di perangkatmu (penyimpanan lokal) agar tidak hilang saat berpindah halaman. Sesi masuk disimpan lewat cookie.</p>
      </section>
      <section>
        <h2>Analitik</h2>
        <p>Kami dapat memakai analitik untuk memahami halaman yang sering dipakai. Data sensitif seperti nama, nomor HP, dan alamat tidak dikirim ke analitik.</p>
      </section>
      <section>
        <h2>Hak kamu</h2>
        <p>Kamu dapat meminta koreksi atau penghapusan data akun dengan menghubungi toko lewat halaman Bantuan.</p>
      </section>
    </Legal>
  )
}
