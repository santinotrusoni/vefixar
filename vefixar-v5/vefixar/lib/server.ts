import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
const U = process.env.NEXT_PUBLIC_SUPABASE_URL!, K = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const publicClient = () => createClient(U, K)
export const sessionClient = () => {
  const c = cookies()
  return createServerClient(U, K, { cookies: { getAll: () => c.getAll(), setAll: () => {} } })
}
