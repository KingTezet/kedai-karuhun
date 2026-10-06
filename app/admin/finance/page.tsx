import type { Metadata } from 'next'
import { ArrowDownRight, ArrowUpRight, Scale, Info } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { MANAGER } from '@/lib/permissions'
import { addDays, isYmd, jakartaToday, monthStart } from '@/lib/dates'
import { formatDate, rupiah, cn } from '@/lib/utils'
import { Badge } from '@/components/ui'
import { Empty, Panel, StatCard } from '@/components/admin/ui'
import { AddTransaction, DeleteTransaction, RangeLink } from '@/components/admin/finance-controls'
import { Pagination } from '@/components/pagination'

export const metadata: Metadata = { title: 'Keuangan' }
const PER = 25

type SP = { r?: string; from?: string; to?: string; kategori?: string; page?: string }

export default async function AdminFinance({ searchParams }: { searchParams: Promise<SP> }) {
  await requireRole(MANAGER)
  const sp = await searchParams
  const today = jakartaToday()
  let from = monthStart(today)
  let to = today
  let range = sp.r ?? 'bulan'
  if (range === 'hari') from = today
  else if (range === '7') from = addDays(today, -6)
  else if (range === 'custom' && isYmd(sp.from) && isYmd(sp.to)) { from = sp.from; to = sp.to }
  else range = 'bulan'

  const admin = createAdminClient()
  const kategori = (sp.kategori ?? '').trim()
  const page = Math.max(1, Number(sp.page) || 1)

  let base = admin.from('financial_transactions').select('id,type,category,amount_idr,description,occurred_at,order_id,orders(order_number)', { count: 'exact' }).gte('occurred_at', from).lte('occurred_at', to)
  let sums = admin.from('financial_transactions').select('type,amount_idr,category').gte('occurred_at', from).lte('occurred_at', to).limit(10000)
  if (kategori) { base = base.eq('category', kategori); sums = sums.eq('category', kategori) }
  const [{ data: list, count }, { data: all }, { data: cats }, { data: pending }] = await Promise.all([
    base.order('occurred_at', { ascending: false }).order('created_at', { ascending: false }).range((page - 1) * PER, page * PER - 1),
    sums,
    admin.from('financial_transactions').select('category').limit(2000),
    admin.from('orders').select('total_idr').in('payment_status', ['pending', 'proof_uploaded']).neq('status', 'cancelled'),
  ])
  const income = (all ?? []).filter((x) => x.type === 'income').reduce((s, x) => s + Number(x.amount_idr), 0)
  const expense = (all ?? []).filter((x) => x.type === 'expense').reduce((s, x) => s + Number(x.amount_idr), 0)
  const net = income - expense
  const catList = [...new Set((cats ?? []).map((c) => c.category))].sort()
  const unpaid = (pending ?? []).reduce((s, o) => s + Number(o.total_idr), 0)
  const pages = Math.max(1, Math.ceil((count ?? 0) / PER))

  const href = (o: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ r: range, from: range === 'custom' ? from : undefined, to: range === 'custom' ? to : undefined, kategori, ...o })) if (v) p.set(k, v)
    return `/admin/finance?${p.toString()}`
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <RangeLink href={href({ r: 'hari', page: undefined })} active={range === 'hari'}>Hari ini</RangeLink>
          <RangeLink href={href({ r: '7', page: undefined })} active={range === '7'}>7 hari</RangeLink>
          <RangeLink href={href({ r: 'bulan', page: undefined })} active={range === 'bulan'}>Bulan ini</RangeLink>
        </div>
        <AddTransaction today={today} />
      </div>

      <form className="grid gap-2 sm:grid-cols-[auto_auto_1fr_auto]">
        <input type="hidden" name="r" value="custom" />
        <input type="date" name="from" defaultValue={from} className="input" aria-label="Dari tanggal" />
        <input type="date" name="to" defaultValue={to} className="input" aria-label="Sampai tanggal" />
        <select name="kategori" defaultValue={kategori} className="input" aria-label="Kategori"><option value="">Semua kategori</option>{catList.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        <button className="btn-primary">Terapkan</button>
      </form>
      <p className="text-[14px] text-ink-muted">Periode: {formatDate(from)} – {formatDate(to)}</p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Pemasukan" value={rupiah(income)} tone="good" icon={ArrowUpRight} />
        <StatCard label="Pengeluaran" value={rupiah(expense)} icon={ArrowDownRight} />
        <div className="col-span-2 lg:col-span-1"><StatCard label="Arus kas bersih" value={rupiah(net)} tone={net >= 0 ? 'good' : 'warn'} hint="Pemasukan − pengeluaran" icon={Scale} /></div>
      </div>

      {unpaid > 0 && (
        <p className="flex items-start gap-2 rounded-xl bg-sky-50 p-3 text-[14px] text-sky-900"><Info size={18} className="mt-0.5 shrink-0" /> Ada pesanan senilai <b>{rupiah(unpaid)}</b> yang belum dibayar/diverifikasi. Nilai ini <b>belum dihitung</b> sebagai uang masuk.</p>
      )}

      <Panel title="Transaksi">
        {(list ?? []).length === 0 ? <Empty text="Belum ada transaksi di periode ini." /> : (
          <ul className="divide-y divide-line">
            {(list ?? []).map((t) => {
              const on = (t.orders as unknown as { order_number?: string } | null)?.order_number
              return (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', t.type === 'income' ? 'bg-brand-100 text-brand-700' : 'bg-red-100 text-red-700')}>{t.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{t.description || t.category}</p>
                    <p className="text-[13px] text-ink-muted">{formatDate(t.occurred_at)} · <Badge>{t.category}</Badge>{on ? ` · ${on}` : ''}</p>
                  </div>
                  <p className={cn('shrink-0 font-extrabold', t.type === 'income' ? 'text-brand-700' : 'text-red-700')}>{t.type === 'income' ? '+' : '−'}{rupiah(t.amount_idr)}</p>
                  {!t.order_id && <DeleteTransaction id={t.id} />}
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
      <Pagination page={page} pages={pages} hrefFor={(p) => href({ page: p > 1 ? String(p) : undefined })} />
    </div>
  )
}
