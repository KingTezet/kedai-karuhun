import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/server'

type PushSubscriptionRow = {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

const configured = () => !!(
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY &&
  process.env.VAPID_SUBJECT
)

function setup() {
  if (!configured()) return false
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )
  return true
}

async function sendToSubscriptions(subs: PushSubscriptionRow[], payload: { title: string; body: string; url?: string; type?: string }) {
  if (!setup()) return { sent: 0, failed: 0, removed: 0, configured: false }
  const admin = createAdminClient()
  let sent = 0
  let failed = 0
  let removed = 0
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url || '/',
            type: payload.type || 'general',
          }),
          { TTL: 60 * 60 * 24 },
        )
        sent += 1
      } catch (e) {
        failed += 1
        const code = (e as { statusCode?: number })?.statusCode
        if (code === 404 || code === 410) {
          const { error } = await admin.from('push_subscriptions').delete().eq('id', s.id)
          if (!error) removed += 1
        }
      }
    }),
  )
  return { sent, failed, removed, configured: true }
}

export async function notifyUsers(userIds: string[], title: string, body: string, url = '/', type = 'general') {
  const isConfigured = configured()
  if (!userIds.length || !isConfigured) return { sent: 0, failed: 0, removed: 0, configured: isConfigured, subscriptions: 0 }
  const admin = createAdminClient()
  const subs: PushSubscriptionRow[] = []
  for (let i = 0; i < userIds.length; i += 500) {
    const batch = userIds.slice(i, i + 500)
    const { data } = await admin.from('push_subscriptions').select('id,user_id,endpoint,p256dh,auth').in('user_id', batch)
    subs.push(...((data ?? []) as PushSubscriptionRow[]))
  }
  const result = await sendToSubscriptions(subs, { title, body, url, type })
  return { ...result, subscriptions: subs.length }
}

/** Kirim web push ke semua perangkat staff yang mengaktifkan notifikasi. */
export async function notifyStaff(title: string, body: string, url = '/admin/orders', type = 'order') {
  const admin = createAdminClient()
  const { data: staff } = await admin
    .from('profiles')
    .select('id')
    .in('role', ['staff', 'manager', 'admin'])
    .is('blocked_at', null)
  const ids = (staff ?? []).map((x) => x.id as string)
  return notifyUsers(ids, title, body, url, type)
}

export async function getPushSubscriptionSummary(userIds?: string[]) {
  if (!configured()) return { configured: false, subscriptions: 0 }
  const admin = createAdminClient()
  let q = admin.from('push_subscriptions').select('id', { count: 'exact', head: true })
  if (userIds?.length) q = q.in('user_id', userIds)
  const { count } = await q
  return { configured: true, subscriptions: count ?? 0 }
}

