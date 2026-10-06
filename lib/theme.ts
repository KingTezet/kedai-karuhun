export const DEFAULT_THEME_PRIMARY = '#2F7D3A'

const BRAND_STOPS = [
  ['50', 0.92, 'white'],
  ['100', 0.84, 'white'],
  ['200', 0.68, 'white'],
  ['300', 0.48, 'white'],
  ['400', 0.27, 'white'],
  ['500', 0.08, 'white'],
  ['600', 0.00, 'base'],
  ['700', 0.16, 'black'],
  ['800', 0.30, 'black'],
  ['900', 0.46, 'black'],
] as const

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)))
}

export function normalizeHex(value: string | null | undefined) {
  const raw = (value ?? '').trim()
  return /^#[0-9a-f]{6}$/i.test(raw) ? raw.toUpperCase() : DEFAULT_THEME_PRIMARY
}

function hexToRgb(hex: string) {
  const clean = normalizeHex(hex).slice(1)
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

function mix(base: ReturnType<typeof hexToRgb>, amount: number, target: 'white' | 'black' | 'base') {
  if (target === 'base' || amount === 0) return base
  const to = target === 'white' ? 255 : 0
  return {
    r: clamp(base.r + (to - base.r) * amount),
    g: clamp(base.g + (to - base.g) * amount),
    b: clamp(base.b + (to - base.b) * amount),
  }
}

export function themeCssVariables(hex: string | null | undefined): Record<string, string> {
  const base = hexToRgb(hex ?? DEFAULT_THEME_PRIMARY)
  return Object.fromEntries(
    BRAND_STOPS.map(([shade, amount, target]) => {
      const rgb = mix(base, amount, target)
      return [`--brand-${shade}`, `${rgb.r} ${rgb.g} ${rgb.b}`]
    }),
  )
}
