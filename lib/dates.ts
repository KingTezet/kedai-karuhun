const OFFSET_MS = 7 * 60 * 60 * 1000 // Asia/Jakarta, tanpa DST

/** YYYY-MM-DD hari ini di Jakarta */
export function jakartaToday() {
  return new Date(Date.now() + OFFSET_MS).toISOString().slice(0, 10)
}

/** Awal hari (00:00 WIB) dari string YYYY-MM-DD -> ISO UTC */
export function jakartaStart(ymd: string) {
  return new Date(new Date(`${ymd}T00:00:00.000Z`).getTime() - OFFSET_MS).toISOString()
}

/** Awal hari berikutnya (eksklusif) */
export function jakartaEndExclusive(ymd: string) {
  return new Date(new Date(`${ymd}T00:00:00.000Z`).getTime() + 24 * 3600 * 1000 - OFFSET_MS).toISOString()
}

export function addDays(ymd: string, days: number) {
  return new Date(new Date(`${ymd}T00:00:00.000Z`).getTime() + days * 24 * 3600 * 1000).toISOString().slice(0, 10)
}

export function monthStart(ymd: string) {
  return ymd.slice(0, 8) + '01'
}

export const isYmd = (s: string | undefined): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s)
