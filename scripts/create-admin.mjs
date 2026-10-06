import { createClient } from '@supabase/supabase-js'

if (typeof process.loadEnvFile === 'function' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try { process.loadEnvFile('.env.local') } catch {}
}

// Keep this script dependency-free from TypeScript aliases: duplicate the tiny deterministic mapping here.
const [phoneArg, password, nameArg = 'Admin Kedai Karuhun'] = process.argv.slice(2)
const digits = (phoneArg ?? '').replace(/\D/g, '')
const local = digits.startsWith('62') ? digits.slice(2) : digits.startsWith('0') ? digits.slice(1) : digits
const phone = local ? `+62${local}` : ''
const internalEmail = local ? `62${local}@auth.kedaikaruhun.my.id` : ''

if (!phone || !password) {
  console.error('Usage: npm run admin:create -- 081234567890 "PasswordMinimal8" "Nama Admin"')
  process.exit(1)
}
if (!/^\+628\d{8,12}$/.test(phone) || !/^62\d{9,13}@auth\.kedaikaruhun\.my\.id$/.test(internalEmail)) {
  console.error('Nomor HP Indonesia tidak valid. Contoh: 0812 3456 7890')
  process.exit(1)
}
if (password.length < 8) {
  console.error('Password minimal 8 karakter.')
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib tersedia di environment lokal.')
  process.exit(1)
}

const sb = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
const targetName = nameArg.trim() || 'Admin Kedai Karuhun'
const listed = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (listed.error) { console.error(listed.error.message); process.exit(1) }

let user = listed.data.users.find((u) => u.email === internalEmail || u.phone === phone) ?? null
if (user) {
  const updated = await sb.auth.admin.updateUserById(user.id, {
    email: internalEmail,
    email_confirm: true,
    password,
    user_metadata: { ...(user.user_metadata ?? {}), full_name: targetName, phone },
  })
  if (updated.error || !updated.data.user) { console.error(updated.error?.message || 'Gagal memperbarui user admin.'); process.exit(1) }
  user = updated.data.user
} else {
  const created = await sb.auth.admin.createUser({
    email: internalEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: targetName, phone },
  })
  if (created.error || !created.data.user) { console.error(created.error?.message || 'Gagal membuat user admin.'); process.exit(1) }
  user = created.data.user
}

const localPhone = `0${local}`
await sb.from('phone_auth_accounts').upsert({ user_id: user.id, phone_e164: phone }, { onConflict: 'user_id' })
const { error: profileError } = await sb.from('profiles').upsert({
  id: user.id,
  email: null,
  full_name: targetName,
  phone: localPhone,
  role: 'admin',
}, { onConflict: 'id' })
if (profileError) { console.error(profileError.message); process.exit(1) }

console.log(`Admin siap. Login di /login dengan ${localPhone} + password yang baru kamu set.`)
