import type { Metadata } from 'next'
import { requireUser, getCurrentProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getActiveZones, getSettings } from '@/lib/store'
import { CheckoutForm } from '@/components/checkout-form'
import { PageHeader } from '@/components/ui'
import type { Address } from '@/types'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } }

export default async function CheckoutPage() {
  const user = await requireUser('/checkout')
  const sb = await createClient()
  const [profile, zones, settings, { data: addresses }] = await Promise.all([
    getCurrentProfile(),
    getActiveZones(),
    getSettings(),
    sb.from('customer_addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }).order('created_at', { ascending: false }),
  ])
  return (
    <div className="page pb-44 pt-5 sm:pt-8 lg:pb-8">
      <PageHeader title="Checkout" subtitle="Isi data pengantaran, pilih pembayaran, selesai." back={{ href: '/cart', label: 'Keranjang' }} />
      <CheckoutForm
        profile={{ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' }}
        addresses={(addresses ?? []) as Address[]}
        zones={zones}
        storeName={settings?.store_name || 'Kedai Karuhun'}
      />
    </div>
  )
}
