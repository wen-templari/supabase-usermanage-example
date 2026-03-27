import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export type Profile = Database['public']['Tables']['profiles']['Row']

export async function signInWithLogto() {
  return supabase.auth.signInWithOAuth({
    provider: 'custom:logto',
    options: {
      redirectTo: window.location.origin + window.location.pathname,
      scopes: 'openid profile email',
    },
  })
}
