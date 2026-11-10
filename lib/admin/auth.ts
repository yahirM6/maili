import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

/**
 * Exige una sesión con rol admin (app_metadata.role, que el usuario no puede cambiarse).
 * Se usa en el layout del panel y al inicio de cada server action: las actions se pueden
 * llamar con un POST directo, así que el middleware no basta. RLS es la última barrera.
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'admin') redirect('/admin/login')
  return { supabase, user }
}
