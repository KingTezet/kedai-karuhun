'use client'

import Image from 'next/image'
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
  image: string
  alt: string
}

/** Banner foto geser otomatis, dengan titik indikator & panah (desktop). */
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
    }, 6000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, slides.length])

  return (
    <div
      className="group relative overflow-hidden rounded-lg bg-cream-200"
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
            className="relative block aspect-[16/7] w-full shrink-0 snap-start sm:aspect-[16/6] lg:aspect-auto lg:h-[300px]"
            aria-roledescription="slide"
            aria-label={`${n + 1} dari ${slides.length}: ${s.title}`}
          >
            <Image src={s.image} alt={s.alt} fill priority={n === 0} sizes="(min-width:1024px) 900px, 100vw" className="object-cover" />
            <span className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" aria-hidden />
            <span className="absolute inset-y-0 left-0 flex max-w-[78%] flex-col justify-center px-5 text-white sm:max-w-[55%] sm:px-10">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80 sm:text-[11px]">{s.eyebrow}</span>
              <span className="mt-1.5 block text-[18px] font-bold leading-tight sm:text-[28px] lg:text-[32px]">{s.title}</span>
              <span className="mt-1.5 line-clamp-2 block text-[12px] leading-snug text-white/85 sm:text-[15px]">{s.text}</span>
              <span className="mt-4 hidden w-fit rounded-md bg-white px-4 py-2 text-[13px] font-semibold text-ink sm:inline-block">{s.cta}</span>
            </span>
          </Link>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <div className="absolute bottom-3 left-5 flex gap-1.5 sm:left-10">
            {slides.map((_, n) => (
              <button
                key={n}
                onClick={() => go(n)}
                aria-label={`Banner ${n + 1}`}
                className={cn('h-1 rounded-full bg-white transition-all', n === i ? 'w-6' : 'w-3 opacity-50')}
              />
            ))}
          </div>
          <button onClick={() => go(i - 1)} aria-label="Banner sebelumnya" className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink opacity-0 shadow-pop transition group-hover:opacity-100 md:grid">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => go(i + 1)} aria-label="Banner berikutnya" className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink opacity-0 shadow-pop transition group-hover:opacity-100 md:grid">
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  )
}
