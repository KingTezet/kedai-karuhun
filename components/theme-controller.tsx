'use client'

import { useEffect } from 'react'
import { normalizeHex } from '@/lib/theme'

export function ThemeController({ color }: { color?: string | null }) {
  useEffect(() => {
    const hex = normalizeHex(color)
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = hex
  }, [color])
  return null
}
