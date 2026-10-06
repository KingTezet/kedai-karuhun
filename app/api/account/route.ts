import { z } from 'zod'
import { guard, ok, fail, parseBody } from '@/lib/api'
import { authPhone, phoneAuthEmail } from '@/lib/phone-auth'

const schema = z.object({
  full_name: z.string().trim().min(2, 'Nama lengkap wajib diisi.').max(80),
  phone: z.string().trim().min(8, 'Nomor HP wajib diisi.').max(20),
})

export async function PUT(req: Request) {
  const g = await guard('user')
  if ('error' in g) return g.error
  const { data, error } = await parseBody(req, schema)
  if (error) return error

  let phone: string
  let internalEmail: string
  try {
    phone = authPhone(data.phone)
    internalEmail = phoneAuthEmail(data.phone)
  } catch {
    return fail('Nomor HP belum benar. Gunakan nomor Indonesia seperti 0812 3456 7890.')
  }
  if (!/^\+628\d{8,12}$/.test(phone)) return fail('Nomor HP belum benar. Gunakan nomor Indonesia seperti 0812 3456 7890.')

  const { data: conflict } = await g.admin
    .from('phone_auth_accounts')
    .select('user_id')
    .eq('phone_e164', phone)
    .neq('user_id', g.profile.id)
    .maybeSingle()
  if (conflict) return fail('Nomor HP tersebut sudah dipakai akun lain.')

  const { data: currentAuth } = await g.admin.auth.admin.getUserById(g.profile.id)
  if (!currentAuth.user) return fail('Akun tidak ditemukan.', 404)
  const oldEmail = currentAuth.user.email ?? null

  const authUpdate = await g.admin.auth.admin.updateUserById(g.profile.id, {
    email: internalEmail,
    email_confirm: true,
    user_metadata: { ...(currentAuth.user.user_metadata ?? {}), full_name: data.full_name, phone },
  })
  if (authUpdate.error) return fail('Gagal memperbarui identitas login. Coba lagi.', 500)

  const { error: dbErr } = await g.admin.from('profiles').update({ full_name: data.full_name, phone: data.phone.replace(/\D/g, '').replace(/^62/, '0') }).eq('id', g.profile.id)
  if (dbErr) {
    if (oldEmail) {
      await g.admin.auth.admin.updateUserById(g.profile.id, { email: oldEmail, email_confirm: true })
    }
    return fail('Gagal menyimpan data diri. Perubahan login dibatalkan.', 500)
  }

  await g.admin.from('phone_auth_accounts').upsert({ user_id: g.profile.id, phone_e164: phone }, { onConflict: 'user_id' })
  return ok()
}
