import { z } from 'zod'
import { createPublicClient } from '@/lib/supabase/public'
import { fail, ok, parseBody } from '@/lib/api'

const schema = z.object({ ids: z.array(z.string().uuid()).min(1).max(100) })

/** Harga & stok terbaru untuk isi keranjang (data katalog publik). */
export async function POST(req: Request) {
  const { data, error } = await parseBody(req, schema)
  if (error) return error
  const { data: rows, error: dbErr } = await createPublicClient()
    .from('products')
    .select('id,name,price_idr,stock_quantity,unit,image_url,is_active,slug')
    .in('id', data.ids)
  if (dbErr) return fail('Gagal memeriksa keranjang. Coba lagi.', 500)
  return ok({ products: rows ?? [] })
}
