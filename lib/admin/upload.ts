import { createClient } from '@/utils/supabase/client'

export const MAX_IMAGE_MB = 8
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
export const ACCEPT_ATTR = ACCEPTED.join(',')

/** Revisa tipo y peso antes de subir; devuelve el motivo si no sirve. */
export function checkImage(file: File) {
  if (!ACCEPTED.includes(file.type)) return `${file.name}: usa JPG, PNG, WebP o AVIF.`
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `${file.name}: pesa más de ${MAX_IMAGE_MB} MB.`
  return null
}

/**
 * Sube el archivo directo desde el navegador al bucket "products" (las políticas de Storage solo
 * lo permiten a la cuenta admin) y devuelve su URL pública. Se sube desde aquí y no desde una
 * server action porque estas tienen un límite de tamaño de 1 MB por petición.
 */
export async function uploadImage(file: File, folder: string) {
  const supabase = createClient()
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${folder}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage.from('products').upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  })
  if (error) throw new Error(`${file.name}: ${error.message}`)

  return supabase.storage.from('products').getPublicUrl(path).data.publicUrl
}
