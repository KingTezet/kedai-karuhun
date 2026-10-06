import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { MANAGER } from '@/lib/permissions'
import { PageHeader } from '@/components/ui'
import { ProductForm } from '@/components/admin/product-form'
import type { Category, Product } from '@/types'

export const metadata: Metadata = { title: 'Ubah produk' }

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireRole(MANAGER)
  const admin = createAdminClient()
  const [{ data: p }, { data: cats }] = await Promise.all([admin.from('products').select('*').eq('id', id).maybeSingle(), admin.from('categories').select('*').order('sort_order')])
  if (!p) notFound()
  return (
    <>
      <PageHeader title="Ubah produk" subtitle={p.name} back={{ href: '/admin/products', label: 'Semua produk' }} />
      <ProductForm categories={(cats ?? []) as Category[]} product={p as Product} />
    </>
  )
}
