import { randomUUID } from 'crypto'
import { fail, guard, ok } from '@/lib/api'
import { ADMIN, MANAGER } from '@/lib/permissions'

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

/** Upload foto produk / aset toko ke Supabase Storage. */
export async function POST(req: Request) {
  const url = new URL(req.url)
  const bucket = url.searchParams.get('bucket') === 'store-assets' ? 'store-assets' : 'product-images'
  const g = await guard(bucket === 'store-assets' ? ADMIN : MANAGER)
  if ('error' in g) return g.error

  let fd: FormData
  try {
    fd = await req.formData()
  } catch {
    return fail('File tidak terbaca.')
  }
  const file = fd.get('file')
  if (!(file instanceof File) || !file.size) return fail('Pilih foto dulu.')
  if (file.size > 5 * 1024 * 1024) return fail('Ukuran foto maksimal 5 MB.')
  const ext = EXT[file.type]
  if (!ext) return fail('Format foto harus JPG, PNG, atau WEBP.')

  const buf = Buffer.from(await file.arrayBuffer())
  const h = buf.subarray(0, 12)
  const valid = (h[0] === 0xff && h[1] === 0xd8) || (h[0] === 0x89 && h[1] === 0x50) || (h.subarray(0, 4).toString() === 'RIFF' && h.subarray(8, 12).toString() === 'WEBP')
  if (!valid) return fail('Isi file bukan foto yang valid.')

  const path = `${new Date().getFullYear()}/${randomUUID()}.${ext}`
  const up = await g.admin.storage.from(bucket).upload(path, buf, { contentType: file.type, cacheControl: '31536000', upsert: false })
  if (up.error) return fail('Upload gagal. Coba lagi.', 500)
  const { data } = g.admin.storage.from(bucket).getPublicUrl(path)
  return ok({ url: data.publicUrl })
}
