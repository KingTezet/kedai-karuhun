'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Camera, FileText, ImagePlus, Upload } from 'lucide-react'
import { checkFile, prepareImage } from '@/lib/image'
import { uploadForm } from '@/lib/upload'
import { useToast } from '@/lib/toast'
import { track } from '@/lib/analytics'
import { Spinner } from '@/components/ui'

export function ProofUpload({ orderId, hasProof }: { orderId: string; hasProof: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState<number | null>(null)

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) return setPreview(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pick = async (f?: File | null) => {
    if (!f) return
    const err = checkFile(f, true)
    if (err) {
      setError(err)
      setFile(null)
      return
    }
    setError('')
    setFile(await prepareImage(f))
  }

  const send = async () => {
    if (!file) return
    setProgress(0)
    setError('')
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadForm(`/api/orders/${orderId}/proof`, fd, setProgress)
    setProgress(null)
    if (!res.ok) {
      setError(String(res.data.error || 'Upload gagal. Coba lagi.'))
      return
    }
    track('payment_proof_uploaded', { order_id: orderId })
    toast.success('Bukti pembayaran terkirim', { description: 'Toko akan segera memeriksanya.' })
    setFile(null)
    router.refresh()
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 p-4">
      <p className="font-bold">{hasProof ? 'Ganti bukti pembayaran' : 'Sudah bayar? Kirim buktinya'}</p>
      <p className="mt-0.5 text-[14px] text-ink-muted">Foto atau screenshot bukti transfer/QRIS. Maksimal 5 MB.</p>

      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} aria-label="Pilih file bukti pembayaran" />

      {!file ? (
        <button type="button" onClick={() => input.current?.click()} className="btn-secondary mt-3 w-full">
          <ImagePlus size={20} /> Pilih foto / screenshot
        </button>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-2">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Pratinjau bukti pembayaran" className="h-20 w-20 rounded-lg object-cover" />
            ) : (
              <span className="grid h-20 w-20 place-items-center rounded-lg bg-cream-200"><FileText size={28} /></span>
            )}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-semibold">{file.name}</p>
              <p className="text-xs text-ink-muted">{(file.size / 1024).toFixed(0)} KB</p>
              <button type="button" onClick={() => input.current?.click()} className="mt-1 inline-flex min-h-[36px] items-center gap-1 text-sm font-bold text-brand-700"><Camera size={15} /> Ganti</button>
            </div>
          </div>
          {progress !== null && (
            <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} className="h-2.5 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          <button onClick={send} disabled={progress !== null} className="btn-primary btn-lg w-full">
            {progress !== null ? <><Spinner /> Mengirim {progress}%</> : <><Upload size={20} /> Kirim bukti pembayaran</>}
          </button>
        </div>
      )}
      {error && <p className="field-error mt-3" role="alert">{error}</p>}
    </div>
  )
}
