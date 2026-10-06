import { NextResponse } from 'next/server'
import type { ZodTypeAny, z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentProfile, type Profile } from '@/lib/auth'
import type { Role } from '@/types'

export const ok = <T extends Record<string, unknown>>(data?: T) => NextResponse.json({ ok: true, ...(data ?? {}) })
export const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status })

export async function parseBody<S extends ZodTypeAny>(req: Request, schema: S): Promise<
  { data: z.infer<S>; error?: undefined } | { data?: undefined; error: NextResponse }
> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return { error: fail('Format data tidak valid.') }
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return { error: fail(parsed.error.issues[0]?.message || 'Data tidak valid.') }
  }
  return { data: parsed.data }
}

/** Guard API: login + role + tidak diblokir. Selalu cek di server. */
export async function guard(roles: Role[] | 'user') {
  const profile = await getCurrentProfile()
  if (!profile) return { error: fail('Silakan masuk dulu.', 401) } as const
  if (profile.blocked_at) return { error: fail('Akun kamu sedang dinonaktifkan.', 403) } as const
  if (roles !== 'user' && !roles.includes(profile.role)) return { error: fail('Kamu tidak punya akses.', 403) } as const
  return { profile, admin: createAdminClient() } as const
}

export type Guarded = { profile: Profile; admin: ReturnType<typeof createAdminClient> }

const DB_MESSAGES: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/INSUFFICIENT_STOCK:(.+)/, (m) => `Stok ${m[1].trim()} tidak cukup. Kurangi jumlahnya ya.`],
  [/MIN_ORDER:(\d+)/, (m) => `Belanja minimal untuk area ini Rp ${Number(m[1]).toLocaleString('id-ID')}.`],
  [/INVALID_ZONE/, () => 'Area pengantaran tidak tersedia.'],
  [/PRODUCT_NOT_FOUND/, () => 'Ada produk yang sudah tidak dijual. Perbarui keranjang.'],
  [/BLOCKED/, () => 'Akun kamu sementara tidak bisa membuat pesanan.'],
  [/EMPTY_ORDER/, () => 'Keranjang masih kosong.'],
  [/INVALID_TRANSITION/, () => 'Status pesanan tidak bisa diubah ke tahap itu.'],
  [/PAYMENT_NOT_VERIFIED/, () => 'Verifikasi pembayaran dulu sebelum memproses pesanan.'],
  [/REASON_REQUIRED/, () => 'Alasan wajib diisi.'],
  [/NEGATIVE_STOCK/, () => 'Stok tidak boleh kurang dari 0.'],
  [/COMPLETED_ORDER_LOCKED|CANCELLED_ORDER_LOCKED/, () => 'Pesanan ini sudah ditutup.'],
  [/FORBIDDEN|UNAUTHORIZED/, () => 'Kamu tidak punya akses.'],
]

export function dbError(message: string, fallback = 'Terjadi kesalahan. Coba lagi.') {
  for (const [re, fn] of DB_MESSAGES) {
    const m = message.match(re)
    if (m) return fn(m)
  }
  if (/duplicate key.*sku/i.test(message)) return 'SKU sudah dipakai produk lain.'
  if (/duplicate key.*slug/i.test(message)) return 'Alamat produk/kategori (slug) sudah dipakai.'
  return fallback
}
