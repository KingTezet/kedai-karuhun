'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Ban, CircleCheck } from 'lucide-react'
import type { Role } from '@/types'
import { ROLE_LABEL } from '@/lib/status'
import { useToast } from '@/lib/toast'
import { Sheet } from '@/components/sheet'
import { Spinner } from '@/components/ui'

async function patch(body: Record<string, unknown>) {
  const res = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok && json.ok !== false, error: (json.error as string) || 'Terjadi kesalahan.' }
}

export function UserControls({ id, role, blocked, canChangeRole, canBlock }: { id: string; role: Role; blocked: boolean; canChangeRole: boolean; canBlock: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const run = async (body: Record<string, unknown>, ok: string) => {
    setBusy(true)
    const r = await patch({ id, ...body })
    setBusy(false)
    setConfirm(false)
    if (!r.ok) return toast.error(r.error)
    toast.success(ok)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {canChangeRole && (
        <div>
          <label htmlFor="role" className="label">Peran</label>
          <select id="role" className="input" value={role} disabled={busy} onChange={(e) => run({ role: e.target.value }, `Peran diubah ke ${ROLE_LABEL[e.target.value]}`)}>
            {(['customer', 'staff', 'manager', 'admin'] as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </div>
      )}
      {canBlock && (
        <button className={blocked ? 'btn-soft w-full' : 'btn-danger-soft w-full'} disabled={busy} onClick={() => (blocked ? run({ blocked: false }, 'Akun diaktifkan') : setConfirm(true))}>
          {busy ? <Spinner /> : blocked ? <CircleCheck size={18} /> : <Ban size={18} />} {blocked ? 'Aktifkan akun' : 'Blokir akun'}
        </button>
      )}
      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Blokir akun ini?" description="Pengguna tidak bisa membuat pesanan baru sampai diaktifkan lagi."
        footer={<div className="flex gap-3"><button className="btn-secondary flex-1" onClick={() => setConfirm(false)}>Batal</button><button className="btn-danger flex-1" disabled={busy} onClick={() => run({ blocked: true }, 'Akun diblokir')}>Ya, blokir</button></div>}>
        <p className="text-[15px] text-ink-muted">Pesanan yang sudah ada tidak terpengaruh.</p>
      </Sheet>
    </div>
  )
}
