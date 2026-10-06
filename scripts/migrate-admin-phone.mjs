import { createClient } from '@supabase/supabase-js'

if (typeof process.loadEnvFile === 'function' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try { process.loadEnvFile('.env.local') } catch {}
}

const [emailArg, phoneArg, password, nameArg = 'Admin Kedai Karuhun'] = process.argv.slice(2)
const email = emailArg?.trim().toLowerCase()
const digits = (phoneArg ?? '').replace(/\D/g, '')
const local = digits.startsWith('62') ? digits.slice(2) : digits.startsWith('0') ? digits.slice(1) : digits
const phone = local ? `+62${local}` : ''
const internalEmail = local ? `62${local}@auth.kedaikaruhun.my.id` : ''
if (!email || !phone || !password) {
  console.error('Usage: npm run admin:phone -- email-lama@example.com 081234567890 "PasswordBaruMinimal8" "Nama Admin"')
  process.exit(1)
}
if (!/^\+628\d{8,12}$/.test(phone)) { console.error('Nomor HP Indonesia tidak valid.'); process.exit(1) }
if (password.length < 8) { console.error('Password minimal 8 karakter.'); process.exit(1) }
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) { console.error('NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib tersedia di environment lokal.'); process.exit(1) }
const sb = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
const listed = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (listed.error) { console.error(listed.error.message); process.exit(1) }
const user = listed.data.users.find((u) => u.email?.toLowerCase() === email || u.phone === phone)
if (!user) { console.error('Akun dengan email lama tidak ditemukan.'); process.exit(1) }
const conflict = listed.data.users.find((u) => u.email?.toLowerCase() === internalEmail && u.id !== user.id)
if (conflict) { console.error('Nomor HP tersebut sudah dipakai akun lain.'); process.exit(1) }
const name = nameArg.trim() || 'Admin Kedai Karuhun'
const updated = await sb.auth.admin.updateUserById(user.id, {
  email: internalEmail,
  email_confirm: true,
  password,
  user_metadata: { ...(user.user_metadata ?? {}), full_name: name, phone },
})
if (updated.error || !updated.data.user) { console.error(updated.error?.message || 'Gagal mengubah akun admin.'); process.exit(1) }
const localPhone = `0${local}`
const { error: identityError } = await sb.from('phone_auth_accounts').upsert({ user_id: user.id, phone_e164: phone }, { onConflict: 'user_id' })
const { error: profileError } = await sb.from('profiles').upsert({ id: user.id, email: null, full_name: name, phone: localPhone, role: 'admin' }, { onConflict: 'id' })
if (identityError || profileError) { console.error(identityError?.message || profileError?.message || 'Gagal menyimpan profil admin.'); process.exit(1) }
console.log(`Akun ${email} sekarang login memakai ${localPhone}.`)
console.log('Password sudah diganti ke password yang kamu masukkan saat menjalankan script ini.')
console.log('Phone provider Supabase tidak diperlukan untuk login.')
