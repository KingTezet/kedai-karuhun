import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, FileText, HelpCircle, LayoutDashboard, Package, ShieldCheck } from 'lucide-react'
import { getCurrentProfile, requireUser, STAFF } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getActiveZones } from '@/lib/store'
import { AddressManager, PasswordForm, ProfileForm } from '@/components/account-forms'
import { InstallCard } from '@/components/install-card'
import { CustomerNotifications } from '@/components/customer-notifications'
import { LogoutButton } from '@/components/logout-button'
import { PageHeader } from '@/components/ui'
import type { Address } from '@/types'

export const metadata: Metadata = { title: 'Akun saya', robots: { index: false } }

export default async function AccountPage() {
  const user = await requireUser('/account')
  const sb = await createClient()
  const [profile, zones, { data: addresses }] = await Promise.all([
    getCurrentProfile(),
    getActiveZones(),
    sb.from('customer_addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }).order('created_at', { ascending: false }),
  ])
  const name = profile?.full_name || ''
  const initial = (name || profile?.phone || '?').charAt(0).toUpperCase()

  return (
    <div className="page py-5 sm:py-8">
      <PageHeader title="Akun saya" />
      <div className="grid gap-5 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-5">
          <section className="card flex items-center gap-4 p-4 sm:p-5">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-600 text-2xl font-extrabold text-white">{initial}</span>
            <div className="min-w-0">
              <p className="line-clamp-1 text-xl font-extrabold">{name || 'Lengkapi nama kamu'}</p>
              <p className="line-clamp-1 text-[15px] text-ink-muted">{profile?.phone || user.phone || 'Nomor HP belum diatur'}</p>
            </div>
          </section>

          <section className="card p-4 sm:p-5" aria-labelledby="diri">
            <h2 id="diri" className="mb-4 text-lg font-bold">Data diri</h2>
            <ProfileForm initial={{ full_name: name, phone: profile?.phone ?? user.phone ?? '' }} />
          </section>

          <CustomerNotifications />

          <section className="card p-4 sm:p-5" aria-labelledby="password">
            <h2 id="password" className="mb-1 text-lg font-bold">Keamanan akun</h2>
            <p className="mb-4 text-[14px] text-ink-muted">Login menggunakan nomor HP dan password. Simpan nomor HP yang aktif agar akun mudah diakses.</p>
            <PasswordForm />
          </section>

          <section className="card p-4 sm:p-5" aria-labelledby="alamat">
            <h2 id="alamat" className="mb-4 text-lg font-bold">Alamat tersimpan</h2>
            <AddressManager addresses={(addresses ?? []) as Address[]} zones={zones} defaults={{ name, phone: profile?.phone ?? '' }} />
          </section>
        </div>

        <div className="space-y-4">
          {profile && STAFF.includes(profile.role) && (
            <Link href="/admin" className="card flex min-h-[64px] items-center gap-3 border-brand-300 bg-brand-50 p-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white"><LayoutDashboard size={22} /></span>
              <span className="flex-1 font-bold">Buka panel admin</span>
              <ChevronRight className="text-ink-faint" />
            </Link>
          )}
          <InstallCard always />
          <nav className="card divide-y divide-line overflow-hidden" aria-label="Menu akun">
            {[
              { href: '/orders', label: 'Pesanan saya', icon: Package },
              { href: '/support', label: 'Bantuan', icon: HelpCircle },
              { href: '/privacy', label: 'Kebijakan privasi', icon: ShieldCheck },
              { href: '/terms', label: 'Syarat layanan', icon: FileText },
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex min-h-[56px] items-center gap-3 px-4 hover:bg-cream-100">
                <Icon size={20} className="text-brand-600" />
                <span className="flex-1 font-semibold">{label}</span>
                <ChevronRight size={18} className="text-ink-faint" />
              </Link>
            ))}
          </nav>
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
