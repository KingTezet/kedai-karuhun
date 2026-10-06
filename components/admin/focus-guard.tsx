'use client'

import { useEffect } from 'react'

/**
 * Defensive focus retention for admin forms. Some parent navigation/refresh
 * flows can remount a field while typing; this restores focus to the same
 * semantic field without stealing focus from a deliberate user interaction.
 */
export function AdminFocusGuard() {
  useEffect(() => {
    let last: { id?: string; name?: string; type: 'input' | 'textarea' | 'select' } | null = null
    let raf = 0

    const onInput = (event: Event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
      if (!target || !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      last = { id: target.id || undefined, name: target.getAttribute('name') || undefined, type: target.tagName.toLowerCase() as 'input' | 'textarea' | 'select' }
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!last) return
          if (document.activeElement && document.activeElement !== document.body && document.activeElement !== document.documentElement) return
          const el = (last.id ? document.getElementById(last.id) : null) || (last.name ? document.querySelector(`[name="${CSS.escape(last.name)}"]`) : null)
          if (!el || !(el instanceof HTMLElement)) return
          el.focus({ preventScroll: true })
          if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && 'setSelectionRange' in el) {
            const value = el.value
            try { el.setSelectionRange(value.length, value.length) } catch {}
          }
        })
      })
    }

    document.addEventListener('input', onInput, true)
    return () => {
      document.removeEventListener('input', onInput, true)
      cancelAnimationFrame(raf)
    }
  }, [])

  return null
}
