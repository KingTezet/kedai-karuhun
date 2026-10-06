import { getSettings } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const settings = await getSettings()
  const source = settings?.favicon_url || settings?.logo_url
  if (!source) {
    const url = new URL('/icons/icon-192.png', req.url)
    const fallback = await fetch(url, { cache: 'no-store' })
    return new Response(await fallback.arrayBuffer(), {
      headers: {
        'Content-Type': fallback.headers.get('content-type') || 'image/png',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }
  try {
    const upstream = await fetch(source, { cache: 'no-store' })
    if (!upstream.ok) throw new Error('upstream icon failed')
    return new Response(await upstream.arrayBuffer(), {
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'image/png',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    })
  } catch {
    const url = new URL('/icons/icon-192.png', req.url)
    const fallback = await fetch(url, { cache: 'no-store' })
    return new Response(await fallback.arrayBuffer(), {
      headers: {
        'Content-Type': fallback.headers.get('content-type') || 'image/png',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }
}
