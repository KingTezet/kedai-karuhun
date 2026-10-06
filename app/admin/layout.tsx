import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { STAFF } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/admin/shell'
import { themeCssVariables } from '@/lib/theme'
import { ThemeController } from '@/components/theme-controller'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: { default: 'Panel Admin', template: '%s | Admin Kedai Karuhun' }, robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole(STAFF, '/admin')
  const admin = createAdminClient()
  const [{ count: newOrders }, { count: proofs }, { data: low }, { data: settings }] = await Promise.all([
    admin.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    admin.from('orders').select('id', { count: 'exact', head: true }).eq('payment_status', 'proof_uploaded').neq('status', 'cancelled'),
    admin.from('products').select('stock_quantity,low_stock_threshold').eq('is_active', true),
    admin.from('store_settings').select('store_name,logo_url,theme_primary_hex').eq('id', 1).maybeSingle(),
  ])
  const lowCount = (low ?? []).filter((p) => Number(p.stock_quantity) <= Number(p.low_stock_threshold)).length
  const themeStyle = themeCssVariables(settings?.theme_primary_hex)
  return (
    <div style={themeStyle} className="min-h-[100dvh]">
      <ThemeController color={settings?.theme_primary_hex} />
      <AdminShell
        role={profile.role}
        name={profile.full_name || profile.phone || 'Admin'}
        storeName={settings?.store_name || 'Kedai Karuhun'}
        logoUrl={settings?.logo_url ?? null}
        counts={{ orders: Math.max(newOrders ?? 0, 0) + (proofs ?? 0), lowStock: lowCount }}
      >
        {children}
      </AdminShell>
    </div>
  )
}
