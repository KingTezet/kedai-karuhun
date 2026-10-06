import { z } from 'zod'
import { guard, ok, parseBody, fail } from '@/lib/api'
import { STAFF } from '@/lib/permissions'

export async function GET() {
  const g = await guard(STAFF)
  if ('error' in g) return g.error
  const { data } = await g.admin
    .from('notifications')
    .select('id,type,title,body,href,read_at,created_at')
    .eq('audience_role', 'staff')
    .order('created_at', { ascending: false })
    .limit(40)
  return ok({ items: data ?? [] })
}

const patch = z.object({ id: z.string().uuid().optional(), all: z.boolean().optional() })

export async function PATCH(req: Request) {
  const g = await guard(STAFF)
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, patch)
  if (error) return error
  const now = new Date().toISOString()
  let q = g.admin.from('notifications').update({ read_at: now }).eq('audience_role', 'staff').is('read_at', null)
  if (data.id) q = q.eq('id', data.id)
  else if (!data.all) return fail('Tidak ada yang ditandai.')
  await q
  return ok()
}
