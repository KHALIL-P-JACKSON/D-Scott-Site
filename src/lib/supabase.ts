import { createClient } from '@supabase/supabase-js'

/**
 * Shared client for the studio's Supabase project.
 *
 * Both values come from Vite env variables, which must keep their `VITE_` prefix
 * to reach the browser bundle. Only publishable keys belong here: anything with
 * that prefix ships to visitors.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
