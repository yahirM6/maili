import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Cliente de solo lectura para la tienda: llave pública, sin sesión ni cookies. Al no leer cookies,
 * las páginas que lo usan se pueden generar una vez y guardar en caché; las acciones del admin las
 * renuevan con revalidatePath. RLS limita lo que ve a productos activos.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
