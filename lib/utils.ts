export const rupiah = (n: number | string | null | undefined) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n ?? 0))

export const num = (n: number | string | null | undefined) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(Number(n ?? 0))

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ')

const TZ = 'Asia/Jakarta'

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  }).format(new Date(value))
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ }).format(
    new Date(value),
  )
}

export function timeAgo(value: string | Date) {
  const diff = Date.now() - new Date(value).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Baru saja'
  if (min < 60) return `${min} menit lalu`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} jam lalu`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day} hari lalu`
  return formatDate(value)
}

/** "0812-3456-7890" / "+62 812..." -> "081234567890" */
export function normalizePhone(input: string) {
  let d = input.replace(/\D/g, '')
  if (d.startsWith('62')) d = '0' + d.slice(2)
  else if (d.startsWith('8')) d = '0' + d
  return d
}

/** local phone -> E.164-style auth value for Supabase phone auth. */
export function authPhone(input: string) {
  const d = normalizePhone(input)
  return d ? `+62${d.slice(1)}` : ''
}


/** local phone -> wa.me number */
export function waNumber(phone: string | null | undefined) {
  const d = normalizePhone(phone ?? '')
  return d.startsWith('0') ? '62' + d.slice(1) : d
}

export function waLink(phone: string | null | undefined, text: string) {
  return `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`
}

export function safeNext(raw: string | null | undefined, fallback = '/') {
  if (!raw) return fallback
  return raw.startsWith('/') && !raw.startsWith('//') ? raw : fallback
}

export const PAGE_SIZE = 24
