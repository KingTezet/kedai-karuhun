import { z } from 'zod'
import { revalidateTag } from 'next/cache'
import { dbError, fail, guard, ok, parseBody } from '@/lib/api'
import { MANAGER } from '@/lib/permissions'
import { categorySchema } from '@/lib/validation'

export async function POST(req: Request) {
  const g = await guard(MANAGER)
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, categorySchema)
  if (error) return error
  const { error: e } = await g.admin.from('categories').insert(data)
  if (e) return fail(dbError(e.message, 'Kategori gagal disimpan.'))
  revalidateTag('catalog')
  return ok()
}

export async function PATCH(req: Request) {
  const g = await guard(MANAGER)
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, categorySchema.partial().extend({ id: z.string().uuid() }))
  if (error) return error
  const { id, ...rest } = data
  const { error: e } = await g.admin.from('categories').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', id)
  if (e) return fail(dbError(e.message, 'Kategori gagal diperbarui.'))
  revalidateTag('catalog')
  return ok()
}

export async function DELETE(req: Request) {
  const g = await guard(MANAGER)
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, z.object({ id: z.string().uuid() }))
  if (error) return error
  const { count } = await g.admin.from('products').select('id', { count: 'exact', head: true }).eq('category_id', data.id)
  if ((count ?? 0) > 0) return fail(`Masih ada ${count} produk di kategori ini. Pindahkan produknya atau nonaktifkan kategori.`)
  const { error: e } = await g.admin.from('categories').delete().eq('id', data.id)
  if (e) return fail('Kategori gagal dihapus.')
  revalidateTag('catalog')
  return ok()
}
