import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Role } from '@/types'
import { isPhoneAuthEmail } from '@/lib/phone-auth'

export { STAFF, MANAGER, ADMIN, can } from '@/lib/permissions'

export type Profile = {
  id: string
  email: string | null
  full_name: string | null
  phone: string | null
  role: Role
  blocked_at: string | null
}

export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return data.user
})

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id,email,full_name,phone,role,blocked_at')
    .eq('id', user.id)
    .maybeSingle()
  if (data) return data as Profile
  // profil belum ada (trigger telat) -> fallback aman sebagai customer
  return { id: user.id, email: isPhoneAuthEmail(user.email) ? null : user.email ?? null, full_name: null, phone: user.user_metadata?.phone ?? user.phone ?? null, role: 'customer', blocked_at: null }
})

export async function requireUser(next = '/') {
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`)
  return user
}

export async function requireRole(roles: Role[], next = '/admin') {
  const profile = await getCurrentProfile()
  if (!profile) redirect(`/login?next=${encodeURIComponent(next)}`)
  if (profile.blocked_at || !roles.includes(profile.role)) redirect('/')
  return profile
}
