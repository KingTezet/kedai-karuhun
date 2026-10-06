import { z } from 'zod'
import { revalidateTag } from 'next/cache'
import { dbError, fail, guard, ok, parseBody } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'
import { MANAGER } from '@/lib/permissions'
import { productCreateSchema, productSchema } from '@/lib/validation'

export async function POST(req: Request) {
  const g = await guard(MANAGER)
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, productCreateSchema)
  if (error) return error
  const { initial_stock, ...row } = data
  const { data: created, error: e } = await g.admin.from('products').insert({ ...row, stock_quantity: 0 }).select('id').single()
  if (e || !created) return fail(dbError(e?.message ?? '', 'Produk gagal disimpan.'))
  if (initial_stock > 0) {
    const sb = await createClient()
    await sb.rpc('adjust_stock', { p_product_id: created.id, p_mode: 'in', p_amount: initial_stock, p_note: 'Stok awal' })
  }
  revalidateTag('catalog')
  return ok({ id: created.id })
}

const patchSchema = productSchema.partial().extend({ id: z.string().uuid() })

export async function PATCH(req: Request) {
  const g = await guard(MANAGER)
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, patchSchema)
  if (error) return error
  const { id, ...rest } = data
  const { error: e } = await g.admin.from('products').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', id)
  if (e) return fail(dbError(e.message, 'Produk gagal diperbarui.'))
  revalidateTag('catalog')
  return ok()
}

export async function DELETE(req: Request) {
  const g = await guard(MANAGER)
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, z.object({ id: z.string().uuid() }))
  if (error) return error
  const { count } = await g.admin.from('order_items').select('id', { count: 'exact', head: true }).eq('product_id', data.id)
  if ((count ?? 0) > 0) return fail('Produk ini sudah pernah dipesan, jadi tidak bisa dihapus. Arsipkan saja.')
  const { error: e } = await g.admin.from('products').delete().eq('id', data.id)
  if (e) return fail('Produk gagal dihapus.')
  revalidateTag('catalog')
  return ok()
}
