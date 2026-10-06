import { z } from 'zod'
import { fail, guard, ok, parseBody } from '@/lib/api'
import { addressInput } from '@/lib/validation'

const withId = addressInput.extend({ id: z.string().uuid() })
const idOnly = z.object({ id: z.string().uuid() })
const MAX_ADDRESSES = 10

export async function POST(req: Request) {
  const g = await guard('user')
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, addressInput)
  if (error) return error
  const { count } = await g.admin.from('customer_addresses').select('id', { count: 'exact', head: true }).eq('user_id', g.profile.id)
  if ((count ?? 0) >= MAX_ADDRESSES) return fail(`Maksimal ${MAX_ADDRESSES} alamat tersimpan.`)
  const makeDefault = data.is_default || (count ?? 0) === 0
  if (makeDefault) await g.admin.from('customer_addresses').update({ is_default: false }).eq('user_id', g.profile.id)
  const { error: e } = await g.admin.from('customer_addresses').insert({ ...data, user_id: g.profile.id, is_default: makeDefault })
  if (e) return fail('Alamat gagal disimpan.', 500)
  return ok()
}

export async function PUT(req: Request) {
  const g = await guard('user')
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, withId)
  if (error) return error
  const { id, ...rest } = data
  if (rest.is_default) await g.admin.from('customer_addresses').update({ is_default: false }).eq('user_id', g.profile.id)
  const { error: e, data: row } = await g.admin.from('customer_addresses').update(rest).eq('id', id).eq('user_id', g.profile.id).select('id').maybeSingle()
  if (e || !row) return fail('Alamat tidak ditemukan.', 404)
  return ok()
}

export async function DELETE(req: Request) {
  const g = await guard('user')
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, idOnly)
  if (error) return error
  const { data: row } = await g.admin.from('customer_addresses').delete().eq('id', data.id).eq('user_id', g.profile.id).select('id,is_default').maybeSingle()
  if (!row) return fail('Alamat tidak ditemukan.', 404)
  if (row.is_default) {
    const { data: next } = await g.admin.from('customer_addresses').select('id').eq('user_id', g.profile.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (next) await g.admin.from('customer_addresses').update({ is_default: true }).eq('id', next.id)
  }
  return ok()
}
