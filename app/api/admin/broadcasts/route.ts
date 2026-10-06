import { z } from 'zod'
import { fail, guard, ok, parseBody } from '@/lib/api'
import { ADMIN } from '@/lib/permissions'
import { notifyUsers } from '@/lib/push'

const schema = z.object({
  type: z.enum(['announcement', 'new_product', 'promotion', 'stock', 'other']).default('announcement'),
  title: z.string().trim().min(2).max(90),
  body: z.string().trim().min(2).max(360),
  href: z.string().trim().max(500).refine((v) => !v || v.startsWith('/'), 'Tautan harus berupa URL internal, contoh /products'),
})

export async function GET() {
  const g = await guard(ADMIN)
  if ('error' in g) return g.error
  const { data, error } = await g.admin
    .from('notification_broadcasts')
    .select('id,type,title,body,href,target,recipient_count,push_sent_count,created_at')
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) return fail('Riwayat broadcast tidak dapat dimuat.', 500)
  return ok({ items: data ?? [] })
}

export async function POST(req: Request) {
  const g = await guard(ADMIN)
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, schema)
  if (error) return error

  const { data: customers, error: customerErr } = await g.admin
    .from('profiles')
    .select('id')
    .eq('role', 'customer')
    .is('blocked_at', null)
  if (customerErr) return fail('Daftar pelanggan tidak dapat dimuat.', 500)
  const userIds = (customers ?? []).map((x) => x.id as string)

  const { data: broadcast, error: createErr } = await g.admin
    .from('notification_broadcasts')
    .insert({
      created_by: g.profile.id,
      type: data.type,
      title: data.title,
      body: data.body,
      href: data.href || null,
      target: 'all_customers',
      recipient_count: userIds.length,
      push_sent_count: 0,
    })
    .select('id')
    .single()
  if (createErr || !broadcast) return fail('Broadcast gagal dibuat.', 500)

  let inAppInserted = 0
  for (let i = 0; i < userIds.length; i += 500) {
    const rows = userIds.slice(i, i + 500).map((user_id) => ({
      user_id,
      type: `broadcast_${data.type}`,
      title: data.title,
      body: data.body,
      href: data.href || null,
      broadcast_id: broadcast.id,
    }))
    if (!rows.length) continue
    const { error: insertErr } = await g.admin.from('notifications').insert(rows)
    if (insertErr) return fail('Broadcast tersimpan sebagian. Coba cek riwayat broadcast.', 500)
    inAppInserted += rows.length
  }

  const push = await notifyUsers(userIds, data.title, data.body, data.href || '/', `broadcast_${data.type}`)
  await g.admin
    .from('notification_broadcasts')
    .update({ push_sent_count: push.sent })
    .eq('id', broadcast.id)

  return ok({
    broadcastId: broadcast.id,
    recipients: userIds.length,
    inAppInserted,
    pushSent: push.sent,
    pushFailed: push.failed,
    pushConfigured: push.configured,
  })
}
