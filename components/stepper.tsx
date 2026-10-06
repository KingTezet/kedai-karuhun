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
}: {
  value: number
  unit?: string
  onDec: () => void
  onInc: () => void
  canInc?: boolean
  decIsRemove?: boolean
  full?: boolean
  name: string
}) {
  return (
    <div className={cn('inline-flex items-center rounded-xl border border-brand-200 bg-brand-50', full && 'w-full justify-between')}>
      <button
        type="button"
        onClick={onDec}
        aria-label={decIsRemove ? `Hapus ${name} dari keranjang` : `Kurangi ${name}`}
        className="grid h-11 w-11 place-items-center rounded-xl text-brand-700 transition active:scale-90 active:bg-brand-100"
      >
        {decIsRemove ? <Trash2 size={18} /> : <Minus size={18} />}
      </button>
      <span className="min-w-[3.25rem] px-1 text-center text-[15px] font-bold tabular-nums" aria-live="polite">
        {num(value)}
        {unit && <span className="ml-0.5 text-xs font-semibold text-ink-muted">{unit}</span>}
      </span>
      <button
        type="button"
        onClick={onInc}
        disabled={!canInc}
        aria-label={`Tambah ${name}`}
        className="grid h-11 w-11 place-items-center rounded-xl text-brand-700 transition active:scale-90 active:bg-brand-100 disabled:opacity-40"
      >
        <Plus size={18} />
      </button>
    </div>
  )
}
