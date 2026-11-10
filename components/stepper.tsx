'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { num } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function Stepper({
  value,
  unit,
  onDec,
  onInc,
  canInc = true,
  decIsRemove,
  full,
  name,
  size = 'md',
}: {
  value: number
  unit?: string
  onDec: () => void
  onInc: () => void
  canInc?: boolean
  decIsRemove?: boolean
  full?: boolean
  name: string
  size?: 'sm' | 'md'
}) {
  const btn = cn(
    'grid place-items-center rounded-md text-brand-600 transition active:scale-90 active:bg-brand-100 disabled:text-ink-faint disabled:opacity-60',
    size === 'sm' ? 'h-[32px] w-9' : 'h-10 w-10',
  )
  const icon = size === 'sm' ? 15 : 18
  return (
    <div className={cn('inline-flex items-center rounded-lg border border-cream-300 bg-white', full && 'w-full justify-between')}>
      <button
        type="button"
        onClick={onDec}
        aria-label={decIsRemove ? `Hapus ${name} dari keranjang` : `Kurangi ${name}`}
        className={btn}
      >
        {decIsRemove ? <Trash2 size={icon} /> : <Minus size={icon} strokeWidth={2.6} />}
      </button>
      <span className={cn('min-w-[2.75rem] px-1 text-center font-bold tabular-nums', size === 'sm' ? 'text-[13px]' : 'text-[15px]')} aria-live="polite">
        {num(value)}
        {unit && size === 'md' && <span className="ml-0.5 text-xs font-semibold text-ink-muted">{unit}</span>}
      </span>
      <button
        type="button"
        onClick={onInc}
        disabled={!canInc}
        aria-label={`Tambah ${name}`}
        className={btn}
      >
        <Plus size={icon} strokeWidth={2.6} />
      </button>
    </div>
  )
}
