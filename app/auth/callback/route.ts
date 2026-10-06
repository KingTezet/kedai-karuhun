import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { safeNext } from '@/lib/utils'
import { getRequestPublicOrigin } from '@/lib/site-url'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = getRequestPublicOrigin(request)
  const next = safeNext(url.searchParams.get('next'))
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null

  const supabase = await createClient()
  let failed = false
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    failed = !!error
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    failed = !!error
  } else {
    failed = true
  }
  if (failed) return NextResponse.redirect(new URL(`/login?error=link&next=${encodeURIComponent(next)}`, origin))
  return NextResponse.redirect(new URL(next, origin))
}
