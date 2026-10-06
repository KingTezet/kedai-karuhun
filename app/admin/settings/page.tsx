import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { ADMIN } from '@/lib/permissions'
import { SettingsForm } from '@/components/admin/settings-form'
import type { DeliveryZone, StoreSettings } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Pengaturan' }

export default async function AdminSettings() {
  await requireRole(ADMIN)
  const admin = createAdminClient()
  const [{ data: s }, { data: zones }] = await Promise.all([admin.from('store_settings').select('*').eq('id', 1).maybeSingle(), admin.from('delivery_zones').select('*').order('name')])
  const raw = (s ?? { id: 1, store_name: 'Kedai Karuhun', logo_url: null, logo_contains_store_name: false, favicon_url: null, theme_primary_hex: '#2F7D3A', whatsapp: null, qris_image_url: null, bank_name: null, bank_account_name: null, bank_account_number: null, address: null, open_hours: null, order_notice: null }) as Partial<StoreSettings> & { id?: number }
  const { id: _id, ...rest } = { ...raw, theme_primary_hex: raw.theme_primary_hex ?? '#2F7D3A' } as StoreSettings
  void _id
  return <SettingsForm settings={rest} zones={(zones ?? []) as DeliveryZone[]} />
}
