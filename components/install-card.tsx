'use client'

import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import { useInstall } from '@/components/providers'

const KEY = 'kk-install-dismissed'

export function InstallCard({ always }: { always?: boolean }) {
  const { canPrompt, isIOS, installed, prompt } = useInstall()
  const [hidden, setHidden] = useState(true)
  useEffect(() => {
    try {
      setHidden(!always && localStorage.getItem(KEY) === '1')
    } catch {
      setHidden(false)
    }
  }, [always])

  if (installed || hidden || (!canPrompt && !isIOS)) return null
  return (
    <div className="card relative flex items-center gap-3 border-brand-200 bg-brand-50 p-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
        <Download size={24} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold">Tambahkan ke HP</p>
        {isIOS ? (
          <p className="text-sm text-ink-muted">
            Ketuk <Share size={14} className="inline -translate-y-px" /> lalu pilih <b>Tambah ke Layar Utama</b>.
          </p>
        ) : (
          <p className="text-sm text-ink-muted">Belanja lebih cepat, langsung dari layar utama.</p>
        )}
      </div>
      {canPrompt && (
        <button onClick={prompt} className="btn-primary btn-sm shrink-0">Pasang</button>
      )}
      {!always && (
        <button
          aria-label="Sembunyikan"
          onClick={() => {
            try {
              localStorage.setItem(KEY, '1')
            } catch {}
            setHidden(true)
          }}
          className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-ink-muted shadow-card"
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}
