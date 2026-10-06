import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/types'

export const ORDER_FLOW: OrderStatus[] = ['new', 'confirmed', 'processing', 'ready', 'delivering', 'completed']

export const ORDER_LABEL: Record<OrderStatus, string> = {
  new: 'Pesanan masuk',
  confirmed: 'Dikonfirmasi',
  processing: 'Disiapkan',
  ready: 'Siap diantar',
  delivering: 'Sedang diantar',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

export const ORDER_HINT: Record<OrderStatus, string> = {
  new: 'Pesananmu sudah kami terima. Toko akan segera mengecek.',
  confirmed: 'Toko sudah menerima pesananmu.',
  processing: 'Pesananmu sedang disiapkan.',
  ready: 'Pesanan sudah siap dan menunggu kurir.',
  delivering: 'Pesananmu sedang dalam perjalanan.',
  completed: 'Pesanan sudah sampai. Terima kasih sudah belanja!',
  cancelled: 'Pesanan ini dibatalkan.',
}

/** aksi admin berikutnya untuk tiap status */
export const NEXT_ACTION: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  new: { to: 'confirmed', label: 'Konfirmasi pesanan' },
  confirmed: { to: 'processing', label: 'Mulai siapkan' },
  processing: { to: 'ready', label: 'Tandai siap diantar' },
  ready: { to: 'delivering', label: 'Mulai antar' },
  delivering: { to: 'completed', label: 'Selesaikan pesanan' },
}

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: 'Belum dibayar',
  proof_uploaded: 'Menunggu verifikasi',
  verified: 'Sudah dibayar',
  failed: 'Pembayaran ditolak',
  cod: 'Bayar di tempat',
}

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  qris: 'QRIS',
  transfer: 'Transfer bank',
  cod: 'COD (bayar di tempat)',
}

export type Tone = 'neutral' | 'info' | 'warn' | 'good' | 'bad'

export const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-cream-200 text-ink-soft',
  info: 'bg-sky-100 text-sky-800',
  warn: 'bg-amber-100 text-amber-900',
  good: 'bg-brand-100 text-brand-800',
  bad: 'bg-red-100 text-red-800',
}

export const ORDER_TONE: Record<OrderStatus, Tone> = {
  new: 'warn',
  confirmed: 'info',
  processing: 'info',
  ready: 'info',
  delivering: 'info',
  completed: 'good',
  cancelled: 'bad',
}

export const PAYMENT_TONE: Record<PaymentStatus, Tone> = {
  pending: 'warn',
  proof_uploaded: 'info',
  verified: 'good',
  failed: 'bad',
  cod: 'neutral',
}

export const MOVEMENT_LABEL: Record<string, string> = {
  sale: 'Penjualan',
  purchase: 'Stok masuk',
  adjustment: 'Koreksi stok',
  waste: 'Rusak / terbuang',
  return: 'Retur',
  cancel: 'Pembatalan pesanan',
}

export const ROLE_LABEL: Record<string, string> = {
  customer: 'Pelanggan',
  staff: 'Staf',
  manager: 'Manajer',
  admin: 'Admin',
}
