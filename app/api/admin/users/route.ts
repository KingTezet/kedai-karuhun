import { fail, guard, ok, parseBody } from '@/lib/api'
import { MANAGER, can } from '@/lib/permissions'
import { userPatchSchema } from '@/lib/validation'
import { authPhone, phoneAuthEmail } from '@/lib/phone-auth'
import { z } from 'zod'

const createUserSchema = z.object({
  phone: z.string().trim().min(8, 'Nomor HP wajib diisi.').max(20),
  password: z.string().min(8, 'Password minimal 8 karakter.').max(72, 'Password terlalu panjang.'),
  full_name: z.string().trim().min(2, 'Nama lengkap wajib diisi.').max(80),
  role: z.enum(['customer', 'staff', 'manager', 'admin']).default('customer'),
})

export async function POST(req: Request) {
  const g = await guard(MANAGER)
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, createUserSchema)
  if (error) return error
  if (g.profile.role !== 'admin' && data.role !== 'customer' && data.role !== 'staff') return fail('Manajer hanya bisa membuat pelanggan atau staf.', 403)

  let phone: string
  let internalEmail: string
  try {
    phone = authPhone(data.phone)
    internalEmail = phoneAuthEmail(data.phone)
    if (!/^\+628\d{8,12}$/.test(phone)) return fail('Nomor HP belum benar. Gunakan nomor Indonesia seperti 0812 3456 7890.')
  } catch {
    return fail('Nomor HP belum benar.')
  }

  const { data: conflict } = await g.admin.from('phone_auth_accounts').select('user_id').eq('phone_e164', phone).maybeSingle()
  if (conflict) return fail('Nomor HP ini sudah terdaftar.')

  const { data: created, error: authError } = await g.admin.auth.admin.createUser({
    email: internalEmail,
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name: data.full_name, phone },
  })
  if (authError || !created.user) {
    const msg = authError?.message || ''
    if (/already|registered|exists/i.test(msg)) return fail('Nomor HP ini sudah terdaftar.')
    return fail('Akun gagal dibuat. Periksa data lalu coba lagi.', 500)
  }

  const { error: identityError } = await g.admin.from('phone_auth_accounts').upsert({ user_id: created.user.id, phone_e164: phone }, { onConflict: 'user_id' })
  const { error: profileError } = await g.admin.from('profiles').upsert({
    id: created.user.id,
    email: null,
    full_name: data.full_name,
    phone: data.phone.replace(/\D/g, '').replace(/^62/, '0'),
    role: data.role,
    blocked_at: null,
  }, { onConflict: 'id' })

  if (identityError || profileError) {
    await g.admin.from('phone_auth_accounts').delete().eq('user_id', created.user.id)
    await g.admin.auth.admin.deleteUser(created.user.id)
    return fail('Akun gagal disimpan. Tidak ada akun yang ditinggalkan setengah jadi.', 500)
  }

  return ok({ userId: created.user.id })
}

export async function PATCH(req: Request) {
  const g = await guard(MANAGER)
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, userPatchSchema)
  if (error) return error
  if (data.id === g.profile.id) return fail('Kamu tidak bisa mengubah akunmu sendiri.')

  const { data: target } = await g.admin.from('profiles').select('role').eq('id', data.id).maybeSingle()
  if (!target) return fail('Pengguna tidak ditemukan.', 404)

  const update: Record<string, unknown> = {}
  if (data.role !== undefined) {
    if (!can.changeRoles(g.profile.role)) return fail('Hanya admin yang boleh mengubah peran.', 403)
    update.role = data.role
  }
  if (data.blocked !== undefined) {
    if (g.profile.role !== 'admin' && target.role !== 'customer') return fail('Manajer hanya bisa memblokir pelanggan.', 403)
    update.blocked_at = data.blocked ? new Date().toISOString() : null
  }
  if (!Object.keys(update).length) return fail('Tidak ada perubahan.')
  if (data.role && target.role === 'admin' && data.role !== 'admin') {
    const { count } = await g.admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin').is('blocked_at', null)
    if ((count ?? 0) <= 1) return fail('Harus ada minimal satu admin aktif.')
  }
  const { error: e } = await g.admin.from('profiles').update(update).eq('id', data.id)
  if (e) return fail('Gagal memperbarui pengguna.', 500)
  return ok()
}
