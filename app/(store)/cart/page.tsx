import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui'
import { CartView } from '@/components/cart-view'

export const metadata: Metadata = { title: 'Keranjang', robots: { index: false } }

export default function CartPage() {
  return (
    <div className="page pb-44 pt-5 sm:pt-8 lg:pb-8">
      <PageHeader title="Keranjang" subtitle="Cek lagi pesananmu sebelum lanjut" />
      <CartView />
    </div>
  )
}
