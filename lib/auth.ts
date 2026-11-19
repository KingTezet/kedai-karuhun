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

export type SessionUser = {
  id: string
  email: string | null
  phone: string | null
  user_metadata: Record<string, unknown>
}

/**
 * getClaims() verifies the JWT locally (cached JWKS) when the project uses
 * asymmetric signing keys, so it skips the Auth-server round trip that
 * getUser() makes on every request. With legacy symmetric keys it falls back
 * to a getUser() call internally, so it is never less safe.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  const c = data?.claims
  if (error || !c?.sub) return null
  return {
    id: c.sub,
    email: (c.email as string | undefined) || null,
    phone: (c.phone as string | undefined) || null,
    user_metadata: (c.user_metadata as Record<string, unknown> | undefined) ?? {},
  }
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
  return { id: user.id, email: isPhoneAuthEmail(user.email) ? null : user.email ?? null, full_name: null, phone: (user.user_metadata.phone as string | undefined) ?? user.phone ?? null, role: 'customer', blocked_at: null }
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
