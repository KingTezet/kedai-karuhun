import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Search, Users } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { MANAGER } from '@/lib/permissions'
import { ROLE_LABEL } from '@/lib/status'
import { cn } from '@/lib/utils'
import { Badge, EmptyState } from '@/components/ui'
import { Pagination } from '@/components/pagination'
import { CreateUserForm } from '@/components/admin/create-user-form'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Pengguna' }
const PER = 25

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; page?: string }> }) {
  const me = await requireRole(MANAGER)
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const q = (sp.q ?? '').replace(/[,()%*\\]/g, ' ').trim().slice(0, 40)
  const role = ['customer', 'staff', 'manager', 'admin'].includes(sp.role ?? '') ? sp.role! : ''
  let query = createAdminClient().from('profiles').select('id,email,full_name,phone,role,blocked_at,created_at', { count: 'exact' }).order('created_at', { ascending: false })
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
  if (role) query = query.eq('role', role)
  const { data, count } = await query.range((page - 1) * PER, page * PER - 1)
  const pages = Math.max(1, Math.ceil((count ?? 0) / PER))
  const href = (o: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ q, role, ...o })) if (v) p.set(k, v)
    const s = p.toString()
    return s ? `/admin/users?${s}` : '/admin/users'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-[15px] text-ink-muted">{count ?? 0} pengguna</p><CreateUserForm canCreateStaff={me.role === 'admin'} /></div>
      <form className="grid gap-2 sm:grid-cols-[1fr_auto_auto]" role="search">
        <label className="relative"><span className="sr-only">Cari pengguna</span><Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" /><input name="q" defaultValue={q} className="input pl-10" placeholder="Nama atau nomor HP" /></label>
        <select name="role" defaultValue={role} className="input" aria-label="Peran"><option value="">Semua peran</option>{Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <button className="btn-primary">Terapkan</button>
      </form>
      {(data ?? []).length === 0 ? <EmptyState icon={Users} title="Pengguna tidak ditemukan" /> : (
        <>
          <ul className="space-y-3">
            {(data ?? []).map((u) => (
              <li key={u.id}>
                <Link href={`/admin/users/${u.id}`} className={cn('card flex items-center gap-3 p-3 active:scale-[.99]', u.blocked_at && 'opacity-70')}>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-100 text-lg font-extrabold text-brand-700">{(u.full_name || u.phone || '?').charAt(0).toUpperCase()}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{u.full_name || '(belum ada nama)'}</span>
                    <span className="block truncate text-[13px] text-ink-muted">{u.phone || 'Nomor HP belum diatur'}{u.email ? ` · email lama: ${u.email}` : ''}</span>
                  </span>
                  <span className="flex flex-col items-end gap-1"><Badge tone={u.role === 'customer' ? 'neutral' : 'info'}>{ROLE_LABEL[u.role]}</Badge>{u.blocked_at && <Badge tone="bad">Diblokir</Badge>}</span>
                  <ChevronRight size={18} className="shrink-0 text-ink-faint" />
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page} pages={pages} hrefFor={(p) => href({ page: p > 1 ? String(p) : undefined })} />
        </>
      )}
    </div>
  )
}
