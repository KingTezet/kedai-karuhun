import type { ProductQuery, SortKey } from '@/lib/store'

export type RawParams = Record<string, string | string[] | undefined>
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const SORTS: SortKey[] = ['relevan', 'terbaru', 'termurah', 'termahal']

export function parseCatalogParams(sp: RawParams, fixedCategory?: string): ProductQuery {
  const sort = first(sp.sort) as SortKey | undefined
  const num = (v?: string) => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined
  }
  return {
    q: first(sp.q)?.trim() || undefined,
    category: fixedCategory ?? (first(sp.kategori) || undefined),
    sort: sort && SORTS.includes(sort) ? sort : 'relevan',
    available: first(sp.tersedia) === '1',
    min: num(first(sp.min)),
    max: num(first(sp.max)),
    page: num(first(sp.page)) ?? 1,
  }
}

export function buildHref(base: string, q: ProductQuery, override: Partial<Record<string, string | number | undefined | null>> = {}) {
  const p = new URLSearchParams()
  const set = (k: string, v: unknown) => {
    if (v !== undefined && v !== null && v !== '' && v !== false) p.set(k, String(v))
  }
  const merged: Record<string, unknown> = {
    q: q.q,
    kategori: q.category,
    sort: q.sort !== 'relevan' ? q.sort : undefined,
    tersedia: q.available ? 1 : undefined,
    min: q.min,
    max: q.max,
    page: q.page && q.page > 1 ? q.page : undefined,
    ...override,
  }
  for (const [k, v] of Object.entries(merged)) set(k, v)
  const s = p.toString()
  return s ? `${base}?${s}` : base
}
