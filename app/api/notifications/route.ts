import { z } from 'zod'
import { fail, guard, ok, parseBody } from '@/lib/api'

export async function GET() {
  const g = await guard('user')
  if ('error' in g) return g.error
  const { data, error } = await g.admin
    .from('notifications')
    .select('id,type,title,body,href,read_at,created_at,broadcast_id')
    .eq('user_id', g.profile.id)
    .order('created_at', { ascending: false })
    .limit(60)
  if (error) return fail('Notifikasi tidak dapat dimuat.', 500)
  return ok({ items: data ?? [] })
}

export async function PATCH(req: Request) {
  const g = await guard('user')
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, z.object({ id: z.string().uuid().optional(), all: z.boolean().optional() }))
  if (error) return error
  const now = new Date().toISOString()
  let q = g.admin.from('notifications').update({ read_at: now }).eq('user_id', g.profile.id).is('read_at', null)
  if (data.id) q = q.eq('id', data.id)
  else if (!data.all) return fail('Tidak ada yang ditandai.')
  const { error: e } = await q
  if (e) return fail('Gagal menandai notifikasi.', 500)
  return ok()
}
