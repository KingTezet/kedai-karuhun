import { z } from 'zod'
import { fail, guard, ok, parseBody } from '@/lib/api'

const schema = z.object({
  endpoint: z.string().url().max(1200),
  keys: z.object({ p256dh: z.string().min(10).max(500), auth: z.string().min(10).max(200) }),
  user_agent: z.string().max(300).optional().nullable(),
})

export async function POST(req: Request) {
  const g = await guard('user')
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, schema)
  if (error) return error
  const { error: dbErr } = await g.admin
    .from('push_subscriptions')
    .upsert(
      {
        user_id: g.profile.id,
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        user_agent: data.user_agent ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' },
    )
  if (dbErr) return fail('Gagal menyimpan langganan notifikasi.', 500)
  return ok()
}

export async function DELETE(req: Request) {
  const g = await guard('user')
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, z.object({ endpoint: z.string().url().max(1200) }))
  if (error) return error
  const { error: dbErr } = await g.admin.from('push_subscriptions').delete().eq('endpoint', data.endpoint).eq('user_id', g.profile.id)
  if (dbErr) return fail('Gagal mematikan notifikasi.', 500)
  return ok()
}
