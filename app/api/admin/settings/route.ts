import { revalidateTag } from 'next/cache'
import { fail, guard, ok, parseBody } from '@/lib/api'
import { ADMIN } from '@/lib/permissions'
import { settingsSchema } from '@/lib/validation'

export async function PUT(req: Request) {
  const g = await guard(ADMIN)
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, settingsSchema)
  if (error) return error
  const clean = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, typeof v === 'string' && v.trim() === '' ? null : v]))
  const { error: e } = await g.admin.from('store_settings').upsert({ id: 1, ...clean, store_name: data.store_name, updated_at: new Date().toISOString() })
  if (e) {
    const msg = e.message || ''
    if (/theme_primary_hex|logo_contains_store_name|favicon_url|column .* does not exist|schema cache/i.test(msg)) {
      return fail('Database belum diperbarui. Jalankan migration 004_reliability_and_branding.sql, 005_store_theme.sql, dan 006_branding_category_icons.sql di Supabase SQL Editor, lalu coba simpan lagi.', 500)
    }
    return fail(`Pengaturan gagal disimpan: ${msg.slice(0, 220)}`, 500)
  }
  revalidateTag('settings')
  return ok()
}
