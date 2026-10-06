import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { createClient } from '@/lib/supabase/server'
import { PAGE_SIZE } from '@/lib/utils'
import type { Category, DeliveryZone, Product, StoreSettings } from '@/types'

const PRODUCT_SELECT = '*, category:categories(id,name,slug)'

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    try {
      const { data } = await createPublicClient()
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .order('name')
      return (data ?? []) as Category[]
    } catch {
      return []
    }
  },
  ['kk-categories'],
  { revalidate: 120, tags: ['catalog'] },
)

export const getSettings = unstable_cache(
  async (): Promise<StoreSettings | null> => {
    try {
      const { data } = await createPublicClient().from('store_settings').select('*').eq('id', 1).maybeSingle()
      return (data as StoreSettings) ?? null
    } catch {
      return null
    }
  },
  ['kk-settings'],
  { revalidate: 120, tags: ['settings'] },
)

export const getActiveZones = cache(async (): Promise<DeliveryZone[]> => {
  const supabase = await createClient()
  const { data } = await supabase.from('delivery_zones').select('*').eq('is_active', true).order('name')
  return (data ?? []) as DeliveryZone[]
})

export type SortKey = 'relevan' | 'terbaru' | 'termurah' | 'termahal'

export type ProductQuery = {
  q?: string
  category?: string
  sort?: SortKey
  available?: boolean
  min?: number
  max?: number
  page?: number
  featured?: boolean
  limit?: number
}

const cleanQ = (q: string) => q.replace(/[,()%*\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)

export async function queryProducts(params: ProductQuery = {}) {
  const limit = params.limit ?? PAGE_SIZE
  const page = Math.max(1, params.page ?? 1)
  try {
    const sb = createPublicClient()
    let q = sb.from('products').select(PRODUCT_SELECT, { count: 'exact' }).eq('is_active', true)

    if (params.category) {
      const cat = (await getCategories()).find((c) => c.slug === params.category)
      if (!cat) return { products: [] as Product[], total: 0, page, pages: 1 }
      q = q.eq('category_id', cat.id)
    }
    if (params.featured) q = q.eq('is_featured', true)
    if (params.available) q = q.gt('stock_quantity', 0)
    if (params.min != null && params.min > 0) q = q.gte('price_idr', params.min)
    if (params.max != null && params.max > 0) q = q.lte('price_idr', params.max)
    const term = params.q ? cleanQ(params.q) : ''
    if (term) q = q.or(`name.ilike.%${term}%,short_description.ilike.%${term}%,sku.ilike.%${term}%`)

    switch (params.sort) {
      case 'terbaru':
        q = q.order('created_at', { ascending: false })
        break
      case 'termurah':
        q = q.order('price_idr', { ascending: true }).order('name')
        break
      case 'termahal':
        q = q.order('price_idr', { ascending: false }).order('name')
        break
      default:
        q = q.order('is_featured', { ascending: false }).order('name')
    }

    const from = (page - 1) * limit
    const { data, count } = await q.range(from, from + limit - 1)
    const total = count ?? 0
    return { products: (data ?? []) as unknown as Product[], total, page, pages: Math.max(1, Math.ceil(total / limit)) }
  } catch {
    return { products: [] as Product[], total: 0, page, pages: 1 }
  }
}

export const getProduct = cache(async (slug: string): Promise<Product | null> => {
  try {
    const { data } = await createPublicClient()
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()
    return (data as unknown as Product) ?? null
  } catch {
    return null
  }
})

export async function getRelated(product: Product, limit = 6) {
  if (!product.category_id) return []
  try {
    const { data } = await createPublicClient()
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .eq('category_id', product.category_id)
      .neq('id', product.id)
      .gt('stock_quantity', 0)
      .order('is_featured', { ascending: false })
      .limit(limit)
    return (data ?? []) as unknown as Product[]
  } catch {
    return []
  }
}

/** Produk yang pernah dibeli user (untuk "Beli lagi"). */
export async function getReorderProducts(userId: string, limit = 8): Promise<Product[]> {
  try {
    const sb = await createClient()
    const { data: orders } = await sb
      .from('orders')
      .select('id')
      .eq('buyer_id', userId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(10)
    const ids = (orders ?? []).map((o) => o.id)
    if (!ids.length) return []
    const { data: items } = await sb.from('order_items').select('product_id').in('order_id', ids)
    const unique = [...new Set((items ?? []).map((i) => i.product_id as string))].slice(0, limit)
    if (!unique.length) return []
    const { data } = await createPublicClient()
      .from('products')
      .select(PRODUCT_SELECT)
      .in('id', unique)
      .eq('is_active', true)
      .gt('stock_quantity', 0)
    return (data ?? []) as unknown as Product[]
  } catch {
    return []
  }
}
