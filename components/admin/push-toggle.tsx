'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { PushToggle as BasePushToggle } from '@/components/push-toggle'
import { useToast } from '@/lib/toast'
import { Spinner } from '@/components/ui'

export function PushToggle() {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const test = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/push/test', { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.ok) throw new Error(json.error || 'Tes notifikasi gagal.')
      toast.success('Tes notifikasi berhasil', { description: 'Cek notifikasi perangkat admin.' })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Tes notifikasi gagal.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <BasePushToggle audience="staff" />
      <button type="button" onClick={test} disabled={busy} className="btn-soft w-full">
        {busy ? <Spinner /> : <Send size={18} />} Kirim tes ke perangkat ini
      </button>
    </div>
  )
}
