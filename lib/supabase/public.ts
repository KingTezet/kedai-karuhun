import { createClient } from '@supabase/supabase-js'

/** Client anon tanpa cookie, khusus data katalog publik (boleh di-cache). */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
