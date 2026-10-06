'use client'

import Link from 'next/link'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Kind = 'success' | 'error' | 'info'
export type ToastAction = { label: string; href?: string; onClick?: () => void }
export type ToastInput = { title: string; description?: string; action?: ToastAction; duration?: number }
type ToastItem = ToastInput & { id: number; kind: Kind; leaving?: boolean }

type ToastApi = {
  success: (title: string, o?: Omit<ToastInput, 'title'>) => void
  error: (title: string, o?: Omit<ToastInput, 'title'>) => void
  info: (title: string, o?: Omit<ToastInput, 'title'>) => void
}

const Ctx = createContext<ToastApi | null>(null)

export function useToast() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useToast harus di dalam ToastProvider')
  return c
}

const ICON = { success: CheckCircle2, error: CircleAlert, info: Info }
const TINT = {
  success: 'bg-brand-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-sky-600 text-white',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, leaving: true } : x)))
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 200)
    const t = timers.current.get(id)
    if (t) clearTimeout(t)
    timers.current.delete(id)
  }, [])

  const push = useCallback(
    (kind: Kind, title: string, o?: Omit<ToastInput, 'title'>) => {
      const id = ++seq.current
      setItems((xs) => [...xs.filter((x) => x.title !== title).slice(-2), { id, kind, title, ...o }])
      timers.current.set(id, setTimeout(() => dismiss(id), o?.duration ?? (o?.action ? 4500 : 3000)))
    },
    [dismiss],
  )

  useEffect(() => {
    const map = timers.current
    return () => map.forEach((t) => clearTimeout(t))
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      success: (t, o) => push('success', t, o),
      error: (t, o) => push('error', t, { duration: 4500, ...o }),
      info: (t, o) => push('info', t, o),
    }),
    [push],
  )

  return (
    <Ctx.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-[calc(var(--safe-t)+68px)] z-[80] flex flex-col items-center gap-2 px-3 md:top-20 md:items-end md:pr-6"
      >
        {items.map((t) => {
          const Icon = ICON[t.kind]
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3 shadow-pop',
                TINT[t.kind],
                t.leaving ? 'animate-toast-out' : 'animate-toast-in',
              )}
            >
              <Icon size={22} className="mt-0.5 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-snug">{t.title}</p>
                {t.description && <p className="mt-0.5 text-[13px] leading-snug text-white/85">{t.description}</p>}
              </div>
              {t.action &&
                (t.action.href ? (
                  <Link
                    href={t.action.href}
                    onClick={() => dismiss(t.id)}
                    className="-my-1 shrink-0 rounded-lg bg-white/20 px-3 py-2 text-sm font-bold hover:bg-white/30"
                  >
                    {t.action.label}
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      t.action?.onClick?.()
                      dismiss(t.id)
                    }}
                    className="-my-1 shrink-0 rounded-lg bg-white/20 px-3 py-2 text-sm font-bold hover:bg-white/30"
                  >
                    {t.action.label}
                  </button>
                ))}
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Tutup pemberitahuan"
                className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-white/15"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}
