import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { MANAGER, can } from '@/lib/permissions'
import { ROLE_LABEL, ORDER_LABEL, ORDER_TONE } from '@/lib/status'
import { formatDateTime, rupiah } from '@/lib/utils'
import { Badge, PageHeader } from '@/components/ui'
import { Empty, Panel } from '@/components/admin/ui'
import { UserControls } from '@/components/admin/user-controls'
import type { OrderStatus, Role } from '@/types'

export const metadata: Metadata = { title: 'Detail pengguna' }

export default async function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const me = await requireRole(MANAGER)
  const admin = createAdminClient()
  const [{ data: u }, { data: orders }, { data: addrs }] = await Promise.all([
    admin.from('profiles').select('*').eq('id', id).maybeSingle(),
    admin.from('orders').select('id,order_number,status,total_idr,created_at').eq('buyer_id', id).order('created_at', { ascending: false }).limit(20),
    admin.from('customer_addresses').select('label,address_line').eq('user_id', id).limit(5),
  ])
  if (!u) notFound()
  const spent = (orders ?? []).filter((o) => o.status === 'completed').reduce((s, o) => s + Number(o.total_idr), 0)
  const isSelf = u.id === me.id
  const canBlock = !isSelf && (me.role === 'admin' || u.role === 'customer')

  return (
    <div>
      <PageHeader title={u.full_name || 'Pengguna'} subtitle={u.phone || u.email || 'Nomor HP belum diatur'} back={{ href: '/admin/users', label: 'Semua pengguna' }} action={<Badge tone={u.role === 'customer' ? 'neutral' : 'info'}>{ROLE_LABEL[u.role as Role]}</Badge>} />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-5">
          <Panel title="Profil">
            <dl className="grid gap-2 text-[15px] sm:grid-cols-2">
              <div><dt className="text-sm text-ink-muted">Nomor HP</dt><dd className="font-semibold">{u.phone || '—'}</dd></div>
              <div><dt className="text-sm text-ink-muted">Bergabung</dt><dd className="font-semibold">{formatDateTime(u.created_at)}</dd></div>
              <div><dt className="text-sm text-ink-muted">Total belanja selesai</dt><dd className="font-semibold">{rupiah(spent)}</dd></div>
              <div><dt className="text-sm text-ink-muted">Status</dt><dd className="font-semibold">{u.blocked_at ? 'Diblokir' : 'Aktif'}</dd></div>
            </dl>
            {(addrs ?? []).length > 0 && <ul className="mt-3 space-y-1 border-t border-line pt-3 text-[14px] text-ink-soft">{(addrs ?? []).map((a, i) => <li key={i}><b>{a.label}:</b> {a.address_line}</li>)}</ul>}
          </Panel>
          <Panel title="Riwayat pesanan">
            {(orders ?? []).length === 0 ? <Empty text="Belum pernah memesan." /> : (
              <ul className="divide-y divide-line">
                {(orders ?? []).map((o) => (
                  <li key={o.id}><Link href={`/admin/orders/${o.id}`} className="flex min-h-[56px] items-center justify-between gap-3 py-2"><span><span className="block font-semibold">{o.order_number}</span><span className="text-[13px] text-ink-muted">{formatDateTime(o.created_at)}</span></span><span className="flex flex-col items-end gap-1"><b>{rupiah(o.total_idr)}</b><Badge tone={ORDER_TONE[o.status as OrderStatus]}>{ORDER_LABEL[o.status as OrderStatus]}</Badge></span></Link></li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <Panel title="Kelola akun">
          {isSelf ? <p className="text-[15px] text-ink-muted">Ini akunmu sendiri.</p> : <UserControls id={u.id} role={u.role as Role} blocked={!!u.blocked_at} canChangeRole={can.changeRoles(me.role)} canBlock={canBlock} />}
        </Panel>
      </div>
    </div>
  )
}
