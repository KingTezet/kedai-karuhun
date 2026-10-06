import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Only refresh the Supabase session on routes where authentication actually
 * matters. Public catalog/navigation requests should stay fast and avoid an
 * unnecessary network round-trip to Supabase.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 0.0.0.0 is a bind address, not a user-facing browser URL.
  // Keep local Supabase/auth flows on localhost unless a canonical site URL is configured.
  if (!process.env.NEXT_PUBLIC_SITE_URL && (request.nextUrl.hostname === '0.0.0.0' || request.nextUrl.hostname === '::')) {
    const url = request.nextUrl.clone()
    url.hostname = 'localhost'
    return NextResponse.redirect(url)
  }
  const protectedRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/reset-password')

  if (!protectedRoute) return NextResponse.next()

  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'))
  const isPrefetch = request.headers.get('next-router-prefetch') === '1' || request.headers.get('purpose') === 'prefetch'

  if (!hasSession) {
    if (pathname.startsWith('/admin')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.search = `?next=${encodeURIComponent(pathname)}`
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  if (isPrefetch) return NextResponse.next()

  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list: Array<{ name: string; value: string; options: CookieOptions }>) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )
  await supabase.auth.getUser()
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/|branding/|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)'],
}
