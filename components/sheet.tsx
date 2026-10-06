'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Bottom-sheet di HP, dialog di layar lebar. */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'md' | 'lg'
}) {
  const [mounted, setMounted] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    panel.current?.focus()
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [open, onClose])

  if (!mounted || !open) return null
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-ink/50" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[90dvh] w-full animate-sheet-up flex-col rounded-t-3xl bg-white shadow-pop outline-none md:rounded-3xl',
          size === 'lg' ? 'md:max-w-2xl' : 'md:max-w-lg',
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Tutup" className="-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink-muted hover:bg-cream-200">
            <X size={22} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line px-5 py-3 pb-[calc(.75rem+var(--safe-b))]">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
