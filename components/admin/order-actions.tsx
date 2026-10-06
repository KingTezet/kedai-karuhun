'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, Check, MessageCircle, X } from 'lucide-react'
import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/types'
import { NEXT_ACTION } from '@/lib/status'
import { useToast } from '@/lib/toast'
import { track } from '@/lib/analytics'
import { Sheet } from '@/components/sheet'
import { Field, Spinner } from '@/components/ui'

async function patch(body: Record<string, unknown>) {
  const res = await fetch('/api/admin/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok && json.ok !== false, error: (json.error as string) || 'Terjadi kesalahan.' }
}

export function OrderActions({
  id,
  status,
  paymentStatus,
  paymentMethod,
  waUrl,
}: {
  id: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  waUrl: string | null
}) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = useState<string | null>(null)
  const [sheet, setSheet] = useState<'cancel' | 'reject' | null>(null)
  const [reason, setReason] = useState('')
  const [err, setErr] = useState('')

  const run = async (key: string, body: Record<string, unknown>, success: string) => {
    setBusy(key)
    setErr('')
    const r = await patch({ id, ...body })
    setBusy(null)
    if (!r.ok) {
      setErr(r.error)
      toast.error(r.error)
      return false
    }
    if (body.status) track('order_status_changed', { order_id: id, status: String(body.status) })
    toast.success(success)
    setSheet(null)
    setReason('')
    router.refresh()
    return true
  }

  const closed = status === 'completed' || status === 'cancelled'
  const next = NEXT_ACTION[status]
  const needsVerify = paymentMethod !== 'cod' && paymentStatus !== 'verified' && !closed
  const blocked = needsVerify && next && next.to !== 'confirmed'

  return (
    <div className="space-y-3">
      {needsVerify && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
          <p className="mb-2 text-[14px] font-bold text-sky-900">
            {paymentStatus === 'proof_uploaded' ? 'Bukti pembayaran menunggu verifikasi' : 'Pembayaran belum diterima'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary" disabled={!!busy} onClick={() => run('verify', { payment_status: 'verified' }, 'Pembayaran diverifikasi')}>
              {busy === 'verify' ? <Spinner /> : <Check size={18} />} Terima
            </button>
            <button className="btn-danger-soft" disabled={!!busy} onClick={() => { setErr(''); setSheet('reject') }}>
              <X size={18} /> Tolak
            </button>
          </div>
        </div>
      )}

      {next && (
        <button className="btn-primary btn-lg w-full" disabled={!!busy || !!blocked} onClick={() => run('next', { status: next.to }, `Status: ${next.label}`)}>
          {busy === 'next' ? <Spinner /> : <ArrowRight size={20} />} {next.label}
        </button>
      )}
      {blocked && <p className="text-center text-[13px] text-ink-muted">Verifikasi pembayaran dulu untuk lanjut memproses.</p>}

      <div className="grid grid-cols-2 gap-2">
        {waUrl && (
          <a href={waUrl} target="_blank" rel="noreferrer" className="btn-soft">
            <MessageCircle size={18} /> WhatsApp
          </a>
        )}
        {!closed && (
          <button className="btn-danger-soft" onClick={() => { setErr(''); setSheet('cancel') }}>
            Batalkan
          </button>
        )}
      </div>

      <Sheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet === 'cancel' ? 'Batalkan pesanan?' : 'Tolak bukti pembayaran?'}
        description={sheet === 'cancel' ? 'Stok akan dikembalikan. Pelanggan diberi tahu alasannya.' : 'Pelanggan akan diminta mengunggah ulang bukti yang benar.'}
        footer={
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setSheet(null)}>Kembali</button>
            <button
              className="btn-danger flex-1"
              disabled={!!busy || reason.trim().length < 3}
              onClick={() =>
                sheet === 'cancel'
                  ? run('cancel', { status: 'cancelled', note: reason.trim() }, 'Pesanan dibatalkan')
                  : run('reject', { payment_status: 'failed', note: reason.trim() }, 'Bukti pembayaran ditolak')
              }
            >
              {busy ? <Spinner /> : sheet === 'cancel' ? 'Ya, batalkan' : 'Tolak bukti'}
            </button>
          </div>
        }
      >
        <Field label="Alasan (wajib)" htmlFor="why" error={err}>
          <textarea id="why" className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={sheet === 'cancel' ? 'Contoh: stok habis, pelanggan membatalkan' : 'Contoh: nominal tidak sesuai, gambar buram'} />
        </Field>
      </Sheet>
    </div>
  )
}
