'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type HeroSlide = {
  eyebrow: string
  title: string
  text: string
  cta: string
  href: string
  tone: 'brand' | 'accent' | 'dark'
  icon: React.ReactNode
}

const TONE: Record<HeroSlide['tone'], string> = {
  brand: 'from-brand-700 via-brand-600 to-brand-500',
  accent: 'from-accent-600 via-accent-500 to-amber-400',
  dark: 'from-slate-900 via-slate-800 to-brand-800',
}

/** Banner promo geser otomatis, dengan titik indikator & panah (desktop). */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const track = useRef<HTMLDivElement>(null)
  const [i, setI] = useState(0)
  const paused = useRef(false)

  const go = (n: number) => {
    const el = track.current
    if (!el) return
    const next = (n + slides.length) % slides.length
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
  }

  useEffect(() => {
    const el = track.current
    if (!el) return
    const onScroll = () => setI(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (slides.length < 2) return
    const t = setInterval(() => {
      if (!paused.current && document.visibilityState === 'visible') go(i + 1)
    }, 5000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, slides.length])

  return (
    <div
      className="group relative overflow-hidden rounded-xl"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onTouchStart={() => (paused.current = true)}
      onTouchEnd={() => (paused.current = false)}
      aria-roledescription="carousel"
    >
      <div ref={track} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
        {slides.map((s, n) => (
          <Link
            key={n}
            href={s.href}
            className={cn('relative flex h-[156px] w-full shrink-0 snap-start items-center overflow-hidden bg-gradient-to-br px-5 text-white sm:h-[220px] sm:px-10 lg:h-[260px]', TONE[s.tone])}
            aria-roledescription="slide"
            aria-label={`${n + 1} dari ${slides.length}: ${s.title}`}
          >
            <span className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 sm:h-80 sm:w-80" aria-hidden />
            <span className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/10 sm:h-56 sm:w-56" aria-hidden />
            <span className="relative z-10 max-w-[70%] sm:max-w-[60%]">
              <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider sm:text-[11px]">{s.eyebrow}</span>
              <span className="mt-2 block text-[19px] font-extrabold leading-tight sm:text-3xl lg:text-[34px]">{s.title}</span>
              <span className="mt-1 line-clamp-2 block text-[12px] text-white/85 sm:mt-2 sm:text-[15px]">{s.text}</span>
              <span className="mt-3 hidden rounded-lg bg-white px-4 py-2 text-[13px] font-bold text-ink sm:inline-block">{s.cta}</span>
            </span>
            <span className="absolute bottom-0 right-3 top-0 z-0 grid place-items-center text-white/90 sm:right-12 [&_svg]:h-20 [&_svg]:w-20 sm:[&_svg]:h-36 sm:[&_svg]:w-36" aria-hidden>
              {s.icon}
            </span>
          </Link>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <div className="absolute bottom-2.5 left-5 flex gap-1.5 sm:left-10">
            {slides.map((_, n) => (
              <button
                key={n}
                onClick={() => go(n)}
                aria-label={`Banner ${n + 1}`}
                className={cn('h-1.5 rounded-full bg-white transition-all', n === i ? 'w-5' : 'w-1.5 opacity-50')}
              />
            ))}
          </div>
          <button onClick={() => go(i - 1)} aria-label="Banner sebelumnya" className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-pop transition group-hover:opacity-100 md:grid">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => go(i + 1)} aria-label="Banner berikutnya" className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-pop transition group-hover:opacity-100 md:grid">
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  )
}
