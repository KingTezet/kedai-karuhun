'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { CartProvider } from '@/lib/cart'
import { ToastProvider } from '@/lib/toast'

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

type InstallApi = {
  canPrompt: boolean
  isIOS: boolean
  installed: boolean
  prompt: () => Promise<void>
}
const InstallCtx = createContext<InstallApi>({ canPrompt: false, isIOS: false, installed: false, prompt: async () => {} })
export const useInstall = () => useContext(InstallCtx)

function PwaProvider({ children }: { children: React.ReactNode }) {
  const [evt, setEvt] = useState<BIPEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
    }
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
    setInstalled(standalone)
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone)
    const onBip = (e: Event) => {
      e.preventDefault()
      setEvt(e as BIPEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setEvt(null)
    }
    window.addEventListener('beforeinstallprompt', onBip)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const prompt = useCallback(async () => {
    if (!evt) return
    await evt.prompt()
    await evt.userChoice.catch(() => null)
    setEvt(null)
  }, [evt])

  const value = useMemo(() => ({ canPrompt: !!evt, isIOS, installed, prompt }), [evt, isIOS, installed, prompt])
  return <InstallCtx.Provider value={value}>{children}</InstallCtx.Provider>
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <CartProvider>
        <PwaProvider>{children}</PwaProvider>
      </CartProvider>
    </ToastProvider>
  )
}
