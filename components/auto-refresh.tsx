'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** Muat ulang data server secara berkala selama tab terlihat. */
export function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter()
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === 'visible' && router.refresh(), seconds * 1000)
    const onVis = () => document.visibilityState === 'visible' && router.refresh()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [router, seconds])
  return null
}
