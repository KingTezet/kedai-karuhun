'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useToast } from '@/lib/toast'
import { cn } from '@/lib/utils'

export function CopyButton({ value, label = 'Salin', className }: { value: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false)
  const toast = useToast()
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setDone(true)
          toast.success('Tersalin', { duration: 1500 })
          setTimeout(() => setDone(false), 2000)
        } catch {
          toast.error('Gagal menyalin. Salin manual ya.')
        }
      }}
      className={cn('btn-soft btn-sm', className)}
    >
      {done ? <Check size={16} /> : <Copy size={16} />}
      {done ? 'Tersalin' : label}
    </button>
  )
}
