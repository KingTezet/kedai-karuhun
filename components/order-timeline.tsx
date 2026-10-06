import { Check, X } from 'lucide-react'
import type { OrderStatus } from '@/types'
import { ORDER_FLOW, ORDER_LABEL } from '@/lib/status'
import { cn } from '@/lib/utils'

export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-red-50 p-3 text-red-800">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-red-600 text-white"><X size={18} /></span>
        <b>Pesanan dibatalkan</b>
      </div>
    )
  }
  const idx = ORDER_FLOW.indexOf(status)
  return (
    <ol className="space-y-0" aria-label="Tahap pesanan">
      {ORDER_FLOW.map((s, i) => {
        const done = i < idx
        const current = i === idx
        return (
          <li key={s} className="relative flex gap-3 pb-4 last:pb-0" aria-current={current ? 'step' : undefined}>
            {i < ORDER_FLOW.length - 1 && <span aria-hidden className={cn('absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-0.5', done ? 'bg-brand-500' : 'bg-line')} />}
            <span className={cn('relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold', done && 'bg-brand-600 text-white', current && 'bg-brand-600 text-white ring-4 ring-brand-100', !done && !current && 'bg-cream-200 text-ink-faint')}>
              {done ? <Check size={16} strokeWidth={3} /> : i + 1}
            </span>
            <span className={cn('pt-1 text-[15px]', current ? 'font-extrabold text-ink' : done ? 'font-semibold text-ink-soft' : 'text-ink-faint')}>{ORDER_LABEL[s]}</span>
          </li>
        )
      })}
    </ol>
  )
}
