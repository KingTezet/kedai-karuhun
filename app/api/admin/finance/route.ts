import { z } from 'zod'
import { fail, guard, ok, parseBody, dbFail } from '@/lib/api'
import { MANAGER } from '@/lib/permissions'
import { expenseSchema } from '@/lib/validation'
import { jakartaToday } from '@/lib/dates'

export async function POST(req: Request) {
  const g = await guard(MANAGER)
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, expenseSchema)
  if (error) return error
  const { error: e } = await g.admin.from('financial_transactions').insert({
    type: data.type,
    category: data.category,
    amount_idr: data.amount_idr,
    description: data.description ?? null,
    occurred_at: data.occurred_at ?? jakartaToday(),
    created_by: g.profile.id,
  })
  if (e) return dbFail(e, 'Transaksi gagal disimpan.', 500, 'finance')
  return ok()
}

/** Hanya transaksi manual yang boleh dihapus; pemasukan dari pesanan tidak. */
export async function DELETE(req: Request) {
  const g = await guard(MANAGER)
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, z.object({ id: z.string().uuid() }))
  if (error) return error
  const { data: row } = await g.admin.from('financial_transactions').select('order_id').eq('id', data.id).maybeSingle()
  if (!row) return fail('Transaksi tidak ditemukan.', 404)
  if (row.order_id) return fail('Transaksi dari pesanan tidak bisa dihapus.')
  const { error: de } = await g.admin.from('financial_transactions').delete().eq('id', data.id)
  if (de) return dbFail(de, 'Transaksi gagal dihapus.', 500, 'finance')
  return ok()
}
