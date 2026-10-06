import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { MANAGER } from '@/lib/permissions'
import { CategoryManager } from '@/components/admin/category-manager'
import type { Category } from '@/types'

export const metadata: Metadata = { title: 'Kategori' }

export default async function AdminCategories() {
  await requireRole(MANAGER)
  const admin = createAdminClient()
  const [{ data: cats }, { data: prods }] = await Promise.all([admin.from('categories').select('*').order('sort_order').order('name'), admin.from('products').select('category_id')])
  const counts: Record<string, number> = {}
  for (const p of prods ?? []) if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1
  return <CategoryManager categories={(cats ?? []) as Category[]} counts={counts} />
}
