import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICON_TONE = {
  neutral: 'bg-sky-50 text-sky-600',
  warn: 'bg-accent-50 text-accent-600',
  good: 'bg-brand-50 text-brand-600',
} as const

export function StatCard({
  label,
  value,
  hint,
  tone = 'neutral',
  href,
  icon: Icon,
}: {
  label: string
  value: string | number
  hint?: string
  tone?: 'neutral' | 'warn' | 'good'
  href?: string
  icon?: React.ComponentType<{ size?: number }>
}) {
  const inner = (
    <div className={cn('card relative h-full overflow-hidden p-4 transition sm:p-5', href && 'hover:-translate-y-0.5 hover:shadow-hover')}>
      {tone === 'warn' && <span className="absolute inset-y-0 left-0 w-1 bg-accent-500" aria-hidden />}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-semibold text-ink-muted sm:text-[13px]">{label}</p>
        {Icon && <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full', ICON_TONE[tone])}><Icon size={18} /></span>}
      </div>
      <p className={cn('mt-1 text-xl font-extrabold tabular-nums sm:text-[26px]', tone === 'good' && 'text-brand-700', tone === 'warn' && 'text-accent-600')}>{value}</p>
      {hint && (
        <p className="mt-1 flex items-center gap-0.5 text-[12px] text-ink-muted">
          {hint}
          {href && <ChevronRight size={13} className="text-ink-faint" />}
        </p>
      )}
    </div>
  )
  return href ? <Link href={href} className="block">{inner}</Link> : inner
}

export function Panel({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('card overflow-hidden', className)}>
      <div className="flex min-h-[52px] items-center justify-between gap-3 border-b border-line px-4 py-2.5 sm:px-5">
        <h2 className="text-[15px] font-extrabold">{title}</h2>
        {action}
      </div>
      <div className="p-4 sm:px-5">{children}</div>
    </section>
  )
}

/** Tautan kecil di header Panel. */
export function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-0.5 text-[13px] font-bold text-brand-600 hover:text-brand-700">
      {children} <ChevronRight size={15} />
    </Link>
  )
}

/** Bar alat (cari + filter) di atas daftar admin. */
export function Toolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('card p-3 sm:p-4', className)}>{children}</div>
}

export function Empty({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-line bg-cream-50 px-4 py-8 text-center text-[14px] text-ink-muted">{text}</p>
}
