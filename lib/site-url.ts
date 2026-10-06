export function getPublicOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured) return configured.replace(/\/+$/, '')

  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    if (url.hostname === '0.0.0.0' || url.hostname === '::') {
      url.hostname = 'localhost'
    }
    return url.origin
  }

  return 'http://localhost:3000'
}

export function getRequestPublicOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured) return configured.replace(/\/+$/, '')

  const url = new URL(request.url)
  if (url.hostname === '0.0.0.0' || url.hostname === '::') {
    url.hostname = 'localhost'
  }
  return url.origin
}
