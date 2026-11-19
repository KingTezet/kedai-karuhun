import { revalidateTag } from 'next/cache'
import { dbError, fail, guard, ok, parseBody } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'
import { STAFF } from '@/lib/permissions'
import { stockSchema } from '@/lib/validation'

const missingFn = (msg: string) => /admin_adjust_stock|could not find the function|PGRST202/i.test(msg)

export async function POST(req: Request) {
  const g = await guard(STAFF)
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, stockSchema)
  if (error) return error
  if (data.mode !== 'in' && !data.note?.trim()) return fail('Alasan wajib diisi.')

  // Preferred: service role + explicit actor (migration 012). Role is already checked by guard().
  let { data: stock, error: e } = await g.admin.rpc('admin_adjust_stock', {
    p_product_id: data.productId,
    p_mode: data.mode,
    p_amount: data.amount,
    p_note: data.note ?? null,
    p_actor_id: g.profile.id,
  })

  // Fallback while migration 012 has not been run yet.
  if (e && missingFn(`${e.code ?? ''} ${e.message}`)) {
    const sb = await createClient()
    ;({ data: stock, error: e } = await sb.rpc('adjust_stock', {
      p_product_id: data.productId,
      p_mode: data.mode,
      p_amount: data.amount,
      p_note: data.note ?? null,
    }))
  }

  if (e) {
    console.error('[inventory] adjust failed', { code: e.code, message: e.message, details: e.details, hint: e.hint })
    const friendly = dbError(e.message, '')
    return fail(friendly || `Stok gagal diperbarui (${e.code || 'db'}: ${e.message.slice(0, 120)})`, 500)
  }
  revalidateTag('catalog')
  return ok({ stock })
}
