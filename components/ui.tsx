import Image from 'next/image'
import Link from 'next/link'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TONE_CLASS, type Tone } from '@/lib/status'

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cn('badge', TONE_CLASS[tone], className)}>{children}</span>
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  className,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  text?: string
  action?: { label: string; href: string }
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center', className)}>
      <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600">
        <Icon size={30} />
      </div>
      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      {text && <p className="mt-1 max-w-sm text-[15px] text-ink-muted">{text}</p>}
      {action && (
        <Link href={action.href} className="btn-primary mt-5">
          {action.label}
        </Link>
      )}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string
  subtitle?: string
  back?: { href: string; label: string }
  action?: React.ReactNode
}) {
  return (
    <div className="mb-5">
      {back && (
        <Link href={back.href} className="mb-2 inline-flex min-h-[40px] items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink">
          <span aria-hidden>←</span> {back.label}
        </Link>
      )}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-[15px] text-ink-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />
}

/** Foto produk. Tanpa foto -> placeholder rapi dengan inisial. */
export function ProductImage({
  src,
  name,
  sizes,
  priority,
  className,
}: {
  src: string | null | undefined
  name: string
  sizes: string
  priority?: boolean
  className?: string
}) {
  if (!src) {
    return (
      <div
        className={cn('relative grid h-full w-full place-items-center bg-gradient-to-br from-brand-50 to-cream-200', className)}
        role="img"
        aria-label={`${name} (foto belum tersedia)`}
      >
        <div className="flex flex-col items-center gap-1 text-brand-600/70">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white/80 text-2xl font-extrabold text-brand-600 shadow-card">
            {name.trim().charAt(0).toUpperCase()}
          </span>
          <ImageOff size={14} aria-hidden />
        </div>
      </div>
    )
  }
  return <Image src={src} alt={name} fill sizes={sizes} priority={priority} className={cn('object-cover', className)} />
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
}: {
  label: string
  hint?: string
  error?: string | null
  required?: boolean
  children: React.ReactNode
  htmlFor?: string
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {children}
      {error ? <p className="field-error" role="alert">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  )
}

export function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
