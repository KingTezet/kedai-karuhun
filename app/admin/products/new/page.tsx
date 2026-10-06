import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { MANAGER } from '@/lib/permissions'
import { PageHeader } from '@/components/ui'
import { ProductForm } from '@/components/admin/product-form'
import type { Category } from '@/types'

export const metadata: Metadata = { title: 'Tambah produk' }

export default async function NewProduct() {
  await requireRole(MANAGER)
  const { data } = await createAdminClient().from('categories').select('*').order('sort_order')
  return (
    <>
      <PageHeader title="Tambah produk" back={{ href: '/admin/products', label: 'Semua produk' }} />
      <ProductForm categories={(data ?? []) as Category[]} />
    </>
  )
}
