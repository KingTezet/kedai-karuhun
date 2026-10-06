'use client'

export type AnalyticsEvent =
  | 'view_product'
  | 'search'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'create_order'
  | 'payment_proof_uploaded'
  | 'order_status_changed'
  | 'admin_view_order'

type Params = Record<string, string | number | boolean | null | undefined>
type Adapter = (event: AnalyticsEvent, params: Params) => void

const BLOCKED = /phone|email|address|alamat|name|nama|token|note|catatan/i

const adapters: Adapter[] = [
  (event, params) => {
    const w = window as unknown as { gtag?: (...a: unknown[]) => void }
    if (typeof w.gtag === 'function') w.gtag('event', event, params)
  },
  (event, params) => {
    if (process.env.NODE_ENV === 'development') console.debug('[track]', event, params)
  },
]

/** Satu pintu untuk semua event. Ganti vendor cukup ubah `adapters`. Data sensitif dibuang otomatis. */
export function track(event: AnalyticsEvent, params: Params = {}) {
  if (typeof window === 'undefined') return
  const clean: Params = {}
  for (const [k, v] of Object.entries(params)) if (!BLOCKED.test(k)) clean[k] = v
  for (const a of adapters) {
    try {
      a(event, clean)
    } catch {}
  }
}
