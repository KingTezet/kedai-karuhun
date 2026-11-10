import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ImageOff } from 'lucide-react'
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
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  title: string
  text?: string
  action?: { label: string; href: string }
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center rounded-lg border border-line bg-white px-6 py-14 text-center', className)}>
      <div className="grid h-20 w-20 place-items-center rounded-full bg-cream-100 text-ink-faint">
        <Icon size={36} strokeWidth={1.4} />
      </div>
      <h2 className="mt-4 text-[17px] font-extrabold">{title}</h2>
      {text && <p className="mt-1 max-w-sm text-[14px] text-ink-muted">{text}</p>}
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
    <div className="mb-4">
      {back && (
        <Link href={back.href} className="mb-1 inline-flex min-h-[32px] items-center gap-1 text-[13px] font-semibold text-brand-600 hover:text-brand-700">
          <ChevronLeft size={16} aria-hidden /> {back.label}
        </Link>
      )}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-[13px] text-ink-muted sm:text-[14px]">{subtitle}</p>}
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
        className={cn('relative grid h-full w-full place-items-center bg-cream-100', className)}
        role="img"
        aria-label={`${name} (foto belum tersedia)`}
      >
        <ImageOff size={28} strokeWidth={1.4} className="text-ink-faint/70" aria-hidden />
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
