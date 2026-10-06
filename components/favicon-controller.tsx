'use client'

import { useEffect } from 'react'

export function FaviconController({ source }: { source?: string | null }) {
  useEffect(() => {
    const version = source ? encodeURIComponent(source) : 'default'
    const href = `/api/brand/icon?v=${version}`

    let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!icon) {
      icon = document.createElement('link')
      icon.rel = 'icon'
      document.head.appendChild(icon)
    }
    icon.href = href
    icon.type = 'image/png'

    let shortcut = document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]')
    if (!shortcut) {
      shortcut = document.createElement('link')
      shortcut.rel = 'shortcut icon'
      document.head.appendChild(shortcut)
    }
    shortcut.href = href
    shortcut.type = 'image/png'

    let apple = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
    if (!apple) {
      apple = document.createElement('link')
      apple.rel = 'apple-touch-icon'
      document.head.appendChild(apple)
    }
    apple.href = href
    apple.sizes = '180x180'
  }, [source])

  return null
}
