'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/** Garis progres tipis di atas layar: memberi tahu pengguna bahwa halaman sedang dimuat. */
export function NavProgress() {
  const pathname = usePathname()
  const search = useSearchParams()
  const [active, setActive] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setActive(false)
    if (timer.current) clearTimeout(timer.current)
  }, [pathname, search])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as HTMLElement).closest('a')
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return
      const url = new URL(a.href, location.href)
      if (url.origin !== location.origin) return
      if (url.pathname === location.pathname && url.search === location.search) return
      setActive(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setActive(false), 10000)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  if (!active) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-brand-100" role="progressbar" aria-label="Memuat halaman">
      <div className="h-full w-2/5 animate-progress-indeterminate rounded-full bg-brand-600" />
    </div>
  )
}
