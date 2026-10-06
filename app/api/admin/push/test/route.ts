export const runtime = 'nodejs'

import { guard, ok, fail } from '@/lib/api'
import { ADMIN } from '@/lib/permissions'
import { notifyUsers } from '@/lib/push'

export async function POST() {
  const g = await guard(ADMIN)
  if ('error' in g) return g.error
  const push = await notifyUsers([g.profile.id], 'Tes notifikasi Kedai Karuhun', 'Kalau pesan ini muncul di HP, Web Push admin sudah aktif.', '/admin/notifications', 'push_test')
  if (!push.configured) return fail('Push server belum dikonfigurasi di environment Vercel.', 503)
  if (push.subscriptions === 0) return fail('Perangkat admin belum terdaftar. Aktifkan notifikasi di akun admin terlebih dahulu.', 409)
  if (push.sent === 0) return fail(`Push gagal dikirim. ${push.failed} device gagal.`, 502)
  return ok({ sent: push.sent, failed: push.failed, removed: push.removed })
}
