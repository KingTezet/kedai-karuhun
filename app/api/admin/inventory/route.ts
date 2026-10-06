import { revalidateTag } from 'next/cache'
import { dbError, fail, guard, ok, parseBody } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'
import { STAFF } from '@/lib/permissions'
import { stockSchema } from '@/lib/validation'

export async function POST(req: Request) {
  const g = await guard(STAFF)
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, stockSchema)
  if (error) return error
  if (data.mode !== 'in' && !data.note?.trim()) return fail('Alasan wajib diisi.')
  const sb = await createClient() // sesi staff -> tercatat siapa yang mengubah
  const { data: stock, error: e } = await sb.rpc('adjust_stock', { p_product_id: data.productId, p_mode: data.mode, p_amount: data.amount, p_note: data.note ?? null })
  if (e) return fail(dbError(e.message, 'Stok gagal diperbarui.'))
  revalidateTag('catalog')
  return ok({ stock })
}
