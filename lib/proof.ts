import { createAdminClient } from '@/lib/supabase/server'

/** URL bukti bayar sementara (5 menit). Panggil HANYA setelah cek kepemilikan/role. */
export async function signedProofUrl(path: string | null | undefined) {
  if (!path) return null
  const { data } = await createAdminClient().storage.from('payment-proofs').createSignedUrl(path, 300)
  return data?.signedUrl ?? null
}
