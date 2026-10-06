import { authPhone, normalizePhone } from '@/lib/utils'

/**
 * Supabase email/password is used as the underlying auth mechanism so the app
 * does not require the Phone provider or an SMS vendor such as Twilio.
 * Customers only ever see/enter their phone number in the UI.
 */
export const PHONE_AUTH_EMAIL_DOMAIN = 'auth.kedaikaruhun.my.id'

export function phoneAuthEmail(input: string) {
  const phone = authPhone(input)
  if (!/^\+628\d{8,12}$/.test(phone)) throw new Error('Nomor HP Indonesia tidak valid.')
  return `${phone.slice(1)}@${PHONE_AUTH_EMAIL_DOMAIN}`
}

export function isPhoneAuthEmail(email: string | null | undefined) {
  return !!email && /^\d{9,15}@auth\.kedaikaruhun\.my\.id$/i.test(email)
}

export { authPhone, normalizePhone }
