import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui'
import { CartView } from '@/components/cart-view'

export const metadata: Metadata = { title: 'Keranjang', robots: { index: false } }

export default function CartPage() {
  return (
    <div className="page pb-28 pt-4 sm:pt-6 lg:pb-8">
      <PageHeader title="Keranjang" subtitle="Cek lagi barang belanjaanmu sebelum checkout" />
      <CartView />
    </div>
  )
}
