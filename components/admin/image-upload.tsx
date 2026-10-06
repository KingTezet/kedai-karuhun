'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { checkFile, prepareImage } from '@/lib/image'
import { uploadForm } from '@/lib/upload'
import { Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

export function ImageUpload({
  value,
  onChange,
  bucket = 'product-images',
  label = 'Foto',
  aspect = 'aspect-[4/3]',
  contain,
}: {
  value: string | null
  onChange: (url: string | null) => void
  bucket?: 'product-images' | 'store-assets'
  label?: string
  aspect?: string
  contain?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState('')

  const pick = async (f?: File | null) => {
    if (!f) return
    const err = checkFile(f)
    if (err) return setError(err)
    setError('')
    const small = await prepareImage(f, 1200, 0.85)
    const local = URL.createObjectURL(small)
    setPreview(local) // pratinjau langsung sebelum upload selesai
    setProgress(0)
    const fd = new FormData()
    fd.append('file', small)
    const res = await uploadForm(`/api/admin/upload?bucket=${bucket}`, fd, setProgress)
    setProgress(null)
    if (!res.ok) {
      setPreview(null)
      URL.revokeObjectURL(local)
      return setError(String(res.data.error || 'Upload gagal.'))
    }
    onChange(String(res.data.url))
    setPreview(null)
    URL.revokeObjectURL(local)
  }

  const shown = preview || value
  return (
    <div>
      <p className="label">{label}</p>
      <div className={cn('relative w-full overflow-hidden rounded-2xl border-2 border-dashed border-line bg-cream-100', aspect)}>
        {shown ? (
          preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Pratinjau" className={cn('h-full w-full', contain ? 'object-contain' : 'object-cover')} />
          ) : (
            <Image src={shown} alt="Foto" fill sizes="400px" className={contain ? 'object-contain' : 'object-cover'} />
          )
        ) : (
          <button type="button" onClick={() => input.current?.click()} className="grid h-full w-full place-items-center text-ink-muted">
            <span className="flex flex-col items-center gap-1"><ImagePlus size={32} /><span className="text-sm font-semibold">Ketuk untuk pilih foto</span></span>
          </button>
        )}
        {progress !== null && (
          <div className="absolute inset-0 grid place-items-center bg-white/70">
            <div className="w-2/3 text-center"><Spinner size={26} /><div className="mt-2 h-2 overflow-hidden rounded-full bg-cream-200"><div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} /></div></div>
          </div>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={label} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => input.current?.click()} className="btn-secondary btn-sm"><ImagePlus size={15} /> {shown ? 'Ganti foto' : 'Pilih foto'}</button>
        {value && <button type="button" onClick={() => onChange(null)} className="btn-danger-soft btn-sm"><Trash2 size={15} /> Hapus</button>}
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <p className="hint">JPG/PNG/WEBP, maksimal 5 MB. Foto dikecilkan otomatis.</p>
    </div>
  )
}
