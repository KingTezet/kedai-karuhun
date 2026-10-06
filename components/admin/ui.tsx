import Link from 'next/link'
import { cn } from '@/lib/utils'

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
    <div className={cn('card h-full p-4 transition', href && 'active:scale-[.99] hover:border-brand-300', tone === 'warn' && 'border-accent-400 bg-accent-50')}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-ink-muted">{label}</p>
        {Icon && <span className={cn('grid h-8 w-8 place-items-center rounded-lg', tone === 'warn' ? 'bg-accent-500 text-white' : 'bg-brand-50 text-brand-600')}><Icon size={17} /></span>}
      </div>
      <p className={cn('mt-1 text-2xl font-extrabold tabular-nums sm:text-[28px]', tone === 'good' && 'text-brand-700')}>{value}</p>
      {hint && <p className="mt-0.5 text-[13px] text-ink-muted">{hint}</p>}
    </div>
  )
  return href ? <Link href={href} className="block">{inner}</Link> : inner
}

export function Panel({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('card p-4 sm:p-5', className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Empty({ text }: { text: string }) {
  return <p className="rounded-xl bg-cream-100 px-4 py-6 text-center text-[15px] text-ink-muted">{text}</p>
}
