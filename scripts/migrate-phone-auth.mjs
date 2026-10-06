import { createClient } from '@supabase/supabase-js'

if (typeof process.loadEnvFile === 'function' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try { process.loadEnvFile('.env.local') } catch {}
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib tersedia di environment lokal.')
  process.exit(1)
}
const sb = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

const users = []
let page = 1
while (true) {
  const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 })
  if (error) { console.error(error.message); process.exit(1) }
  users.push(...data.users)
  if (data.users.length < 1000) break
  page++
}

const emails = new Set(users.map((u) => u.email?.toLowerCase()).filter(Boolean))
let migrated = 0
let skipped = 0

for (const user of users) {
  if (!user.phone) { skipped++; continue }
  const digits = user.phone.replace(/\D/g, '')
  const local = digits.startsWith('62') ? digits.slice(2) : digits.startsWith('0') ? digits.slice(1) : digits
  if (!/^8\d{8,12}$/.test(local)) { skipped++; continue }
  const phone = `+62${local}`
  const internalEmail = `62${local}@auth.kedaikaruhun.my.id`

  const other = users.find((u) => u.id !== user.id && u.email?.toLowerCase() === internalEmail)
  if (other) {
    console.log(`Lewati ${user.id}: alias ${internalEmail} sudah dipakai user ${other.id}.`)
    skipped++
    continue
  }

  if (user.email?.toLowerCase() !== internalEmail) {
    const updated = await sb.auth.admin.updateUserById(user.id, {
      email: internalEmail,
      email_confirm: true,
      user_metadata: { ...(user.user_metadata ?? {}), phone },
    })
    if (updated.error) {
      console.log(`Gagal migrasi ${user.id}: ${updated.error.message}`)
      skipped++
      continue
    }
    emails.delete(user.email?.toLowerCase())
    emails.add(internalEmail)
    migrated++
  }

  await sb.from('phone_auth_accounts').upsert({ user_id: user.id, phone_e164: phone }, { onConflict: 'user_id' })
  await sb.from('profiles').update({ email: null, phone: `0${local}` }).eq('id', user.id)
}

console.log(`Migrasi selesai. ${migrated} akun phone-auth sekarang memakai login nomor HP + password tanpa SMS.`)
if (skipped) console.log(`${skipped} akun dilewati karena tidak punya nomor HP valid atau terdeteksi konflik.`)
