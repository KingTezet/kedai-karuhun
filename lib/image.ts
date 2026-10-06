'use client'

/** Perkecil foto sebelum upload (hemat kuota, upload cepat). PDF/GIF dibiarkan. */
export async function prepareImage(file: File, maxSize = 1600, quality = 0.82): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, maxSize / Math.max(bmp.width, bmp.height))
    if (scale === 1 && file.size < 900_000) return file
    const w = Math.round(bmp.width * scale)
    const h = Math.round(bmp.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export const MAX_UPLOAD = 5 * 1024 * 1024
export function checkFile(file: File, allowPdf = false): string | null {
  const ok = /^image\/(jpeg|png|webp)$/.test(file.type) || (allowPdf && file.type === 'application/pdf')
  if (!ok) return allowPdf ? 'Format harus JPG, PNG, WEBP, atau PDF.' : 'Format foto harus JPG, PNG, atau WEBP.'
  if (file.size > MAX_UPLOAD) return 'Ukuran file maksimal 5 MB.'
  return null
}
