import { z } from 'zod'
import { dbError, fail, guard, ok, parseBody } from '@/lib/api'
import { ADMIN } from '@/lib/permissions'
import { zoneSchema } from '@/lib/validation'

export async function POST(req: Request) {
  const g = await guard(ADMIN)
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, zoneSchema)
  if (error) return error
  const { error: e } = await g.admin.from('delivery_zones').insert(data)
  if (e) return fail(dbError(e.message, 'Area gagal disimpan.'))
  return ok()
}

export async function PATCH(req: Request) {
  const g = await guard(ADMIN)
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, zoneSchema.partial().extend({ id: z.string().uuid() }))
  if (error) return error
  const { id, ...rest } = data
  const { error: e } = await g.admin.from('delivery_zones').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', id)
  if (e) return fail(dbError(e.message, 'Area gagal diperbarui.'))
  return ok()
}

export async function DELETE(req: Request) {
  const g = await guard(ADMIN)
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, z.object({ id: z.string().uuid() }))
  if (error) return error
  const { error: e } = await g.admin.from('delivery_zones').delete().eq('id', data.id)
  if (e) return fail('Area gagal dihapus.')
  return ok()
}
