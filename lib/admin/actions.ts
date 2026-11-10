'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { PostgrestError } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/admin/auth'
import type { ActionResult, ProductInput, VariantInput } from '@/lib/admin/types'
import { buildSku, isSlug, slugify, storagePathFromUrl } from '@/lib/admin/utils'

// Cada action valida rol de admin primero: se pueden invocar con un POST directo, no solo desde la UI.

const BUCKET = 'products'

/** Traduce los errores de Postgres más comunes a algo que se entienda en el panel. */
function friendly(error: PostgrestError, context: { unique?: string; inUse?: string } = {}) {
  if (error.code === '23505') return context.unique ?? 'Ya existe un registro con ese valor.'
  if (error.code === '23503') return context.inUse ?? 'No se puede borrar: otros registros dependen de este.'
  if (error.code === '42501') return 'Tu cuenta no tiene permiso para esta acción.'
  return error.message
}

function revalidateCatalog() {
  revalidatePath('/admin', 'layout')
  revalidatePath('/', 'layout')
}

const nullable = (value: string) => (value.trim() === '' ? null : value.trim())

// ---------------------------------------------------------------------------------------------
// Productos
// ---------------------------------------------------------------------------------------------

/** Crea el producto con lo mínimo y lleva a su página de edición (fotos y variantes van ahí). */
export async function createProduct(input: { title: string; slug: string; category_id: string }): Promise<ActionResult> {
  const { supabase } = await requireAdmin()
  const title = input.title.trim()
  const slug = slugify(input.slug || input.title)

  const fieldErrors: Record<string, string> = {}
  if (!title) fieldErrors.title = 'Escribe un nombre.'
  if (!isSlug(slug)) fieldErrors.slug = 'Solo minúsculas, números y guiones.'
  if (Object.keys(fieldErrors).length) return { ok: false, message: 'Revisa los campos marcados.', fieldErrors }

  const { data, error } = await supabase
    .from('products')
    .insert({ title, slug, category_id: nullable(input.category_id), is_active: false })
    .select('id')
    .single()

  if (error) {
    const message = friendly(error, { unique: 'Ya hay un producto con esa URL (slug). Usa otra.' })
    return { ok: false, message, fieldErrors: error.code === '23505' ? { slug: message } : undefined }
  }

  revalidateCatalog()
  redirect(`/admin/products/${data.id}?nuevo=1`)
}

/** Guarda datos y variantes juntos: lo que el formulario muestra es lo que queda en la base. */
export async function saveProduct(
  id: string,
  input: ProductInput,
  variants: VariantInput[],
): Promise<ActionResult<{ variants: VariantInput[] }>> {
  const { supabase } = await requireAdmin()

  const fieldErrors: Record<string, string> = {}
  const title = input.title.trim()
  const slug = input.slug.trim()
  if (!title) fieldErrors.title = 'Escribe un nombre.'
  if (!isSlug(slug)) fieldErrors.slug = 'Solo minúsculas, números y guiones.'
  if (input.allow_engraving && !(input.max_engraving_chars > 0)) {
    fieldErrors.max_engraving_chars = 'Indica cuántos caracteres se pueden grabar.'
  }

  // Variantes: metal y precio obligatorios; sin combinaciones repetidas de metal + talla + piedra
  const seen = new Map<string, number>()
  variants.forEach((variant, index) => {
    if (!variant.material.trim()) fieldErrors[`variants.${index}.material`] = 'Falta el metal.'
    if (!(variant.price >= 0) || !Number.isFinite(variant.price)) fieldErrors[`variants.${index}.price`] = 'Precio inválido.'
    if (!Number.isInteger(variant.stock_quantity) || variant.stock_quantity < 0) {
      fieldErrors[`variants.${index}.stock_quantity`] = 'Stock inválido.'
    }
    const key = [variant.material, variant.size, variant.gemstone].map((part) => part.trim().toLowerCase()).join('|')
    if (seen.has(key)) fieldErrors[`variants.${index}.size`] = `Repite la variante ${seen.get(key)! + 1}.`
    else seen.set(key, index)
  })

  if (Object.keys(fieldErrors).length) return { ok: false, message: 'Revisa los campos marcados.', fieldErrors }

  // Un producto activo necesita al menos una variante para poder venderse
  if (input.is_active && variants.length === 0) {
    return { ok: false, message: 'Agrega al menos una variante antes de publicar el producto.' }
  }

  const { error: productError } = await supabase
    .from('products')
    .update({
      title,
      slug,
      description: nullable(input.description),
      details: nullable(input.details),
      category_id: nullable(input.category_id),
      subcategory_id: nullable(input.subcategory_id),
      collection_id: nullable(input.collection_id),
      is_active: input.is_active,
      is_featured: input.is_featured,
      sort_order: Math.round(input.sort_order) || 0,
      allow_engraving: input.allow_engraving,
      max_engraving_chars: input.allow_engraving ? Math.round(input.max_engraving_chars) : 0,
    })
    .eq('id', id)

  if (productError) {
    const message = friendly(productError, { unique: 'Ya hay otro producto con esa URL (slug).' })
    return { ok: false, message, fieldErrors: productError.code === '23505' ? { slug: message } : undefined }
  }

  // Variantes: se borran las que ya no están, se actualizan las existentes y se crean las nuevas
  const { data: current, error: currentError } = await supabase.from('product_variants').select('id').eq('product_id', id)
  if (currentError) return { ok: false, message: friendly(currentError) }

  const keep = new Set(variants.filter((variant) => variant.id).map((variant) => variant.id!))
  const removed = current.filter((row) => !keep.has(row.id)).map((row) => row.id)
  if (removed.length) {
    const { error } = await supabase.from('product_variants').delete().in('id', removed)
    if (error) {
      return {
        ok: false,
        message: friendly(error, {
          inUse: 'Una de las variantes que quitaste ya tiene pedidos y no se puede borrar. Déjala con stock 0.',
        }),
      }
    }
  }

  const rows = variants.map((variant) => ({
    ...(variant.id ? { id: variant.id } : {}),
    product_id: id,
    material: variant.material.trim(),
    size: nullable(variant.size),
    gemstone: nullable(variant.gemstone),
    price: Math.round(variant.price * 100) / 100,
    stock_quantity: variant.stock_quantity,
    sku: variant.sku.trim() || buildSku(slug, variant.material, variant.size),
  }))

  let saved: VariantInput[] = []
  if (rows.length) {
    // defaultToNull: false → las filas nuevas (sin id) reciben el id por defecto en lugar de null
    const { data, error } = await supabase
      .from('product_variants')
      .upsert(rows, { defaultToNull: false })
      .select('id, material, size, gemstone, price, stock_quantity, sku')
    if (error) return { ok: false, message: friendly(error, { unique: 'Hay un SKU repetido. Cada variante necesita uno distinto.' }) }

    // Se devuelven en el orden del formulario y con su id: el editor los toma para el siguiente guardado
    saved = rows.map((row) => {
      const match = data.find((item) => (row.id ? item.id === row.id : item.sku === row.sku))!
      return {
        id: match.id,
        material: match.material,
        size: match.size ?? '',
        gemstone: match.gemstone ?? '',
        price: Number(match.price),
        stock_quantity: match.stock_quantity,
        sku: match.sku,
      }
    })
  }

  revalidateCatalog()
  return { ok: true, message: 'Cambios guardados.', data: { variants: saved } }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()

  // Se guardan las rutas antes: al borrar el producto, sus filas de fotos se van en cascada
  const { data: images } = await supabase.from('product_images').select('url').eq('product_id', id)

  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) {
    return {
      ok: false,
      message: friendly(error, {
        inUse: 'Este producto ya tiene pedidos y no se puede borrar. Pásalo a borrador para ocultarlo.',
      }),
    }
  }

  const paths = (images ?? []).map((image) => storagePathFromUrl(image.url, BUCKET)).filter((path): path is string => !!path)
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths)

  revalidateCatalog()
  redirect('/admin?borrado=1')
}

// ---------------------------------------------------------------------------------------------
// Fotos de producto (el archivo lo sube el navegador directo a Storage; aquí se registra)
// ---------------------------------------------------------------------------------------------

export async function registerImages(productId: string, urls: string[], alt: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()

  const { data: last } = await supabase
    .from('product_images')
    .select('display_order')
    .eq('product_id', productId)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const start = (last?.display_order ?? -1) + 1
  const { error } = await supabase
    .from('product_images')
    .insert(urls.map((url, index) => ({ product_id: productId, url, alt_text: alt, display_order: start + index })))

  if (error) return { ok: false, message: friendly(error) }

  await syncPrimaryImage(productId)
  revalidateCatalog()
  return { ok: true, message: urls.length === 1 ? 'Foto agregada.' : `${urls.length} fotos agregadas.` }
}

export async function updateImage(id: string, changes: { material: string; alt_text: string }): Promise<ActionResult> {
  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from('product_images')
    .update({ material: nullable(changes.material), alt_text: nullable(changes.alt_text) })
    .eq('id', id)

  if (error) return { ok: false, message: friendly(error) }
  revalidateCatalog()
  return { ok: true }
}

/** Recibe los ids en el orden nuevo; la primera foto es la principal. */
export async function reorderImages(productId: string, orderedIds: string[]): Promise<ActionResult> {
  const { supabase } = await requireAdmin()
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('product_images').update({ display_order: index }).eq('id', id).eq('product_id', productId),
    ),
  )
  const failed = results.find((result) => result.error)
  if (failed?.error) return { ok: false, message: friendly(failed.error) }

  await syncPrimaryImage(productId)
  revalidateCatalog()
  return { ok: true }
}

export async function deleteImage(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()
  const { data: image, error } = await supabase.from('product_images').delete().eq('id', id).select('url, product_id').single()
  if (error) return { ok: false, message: friendly(error) }

  const path = storagePathFromUrl(image.url, BUCKET)
  if (path) await supabase.storage.from(BUCKET).remove([path])
  if (image.product_id) await syncPrimaryImage(image.product_id)

  revalidateCatalog()
  return { ok: true, message: 'Foto eliminada.' }
}

/** Mantiene products.image_url igual a la primera foto, para lo que todavía lo lee (home, carrito). */
async function syncPrimaryImage(productId: string) {
  const { supabase } = await requireAdmin()
  const { data } = await supabase
    .from('product_images')
    .select('url')
    .eq('product_id', productId)
    .order('display_order')
    .limit(1)
    .maybeSingle()
  await supabase.from('products').update({ image_url: data?.url ?? null }).eq('id', productId)
}

// ---------------------------------------------------------------------------------------------
// Categorías y subcategorías
// ---------------------------------------------------------------------------------------------

interface TaxonomyInput {
  id?: string
  name: string
  slug: string
  description?: string
  sort_order?: number
}

function validateTaxonomy(input: TaxonomyInput) {
  const fieldErrors: Record<string, string> = {}
  if (!input.name.trim()) fieldErrors.name = 'Escribe un nombre.'
  if (!isSlug(input.slug.trim())) fieldErrors.slug = 'Solo minúsculas, números y guiones.'
  return fieldErrors
}

export async function saveCategory(input: TaxonomyInput): Promise<ActionResult> {
  const { supabase } = await requireAdmin()
  const fieldErrors = validateTaxonomy(input)
  if (Object.keys(fieldErrors).length) return { ok: false, message: 'Revisa los campos marcados.', fieldErrors }

  const values = {
    name: input.name.trim(),
    slug: input.slug.trim(),
    description: nullable(input.description ?? ''),
    sort_order: Math.round(input.sort_order ?? 0) || 0,
  }
  const { error } = input.id
    ? await supabase.from('categories').update(values).eq('id', input.id)
    : await supabase.from('categories').insert(values)

  if (error) return { ok: false, message: friendly(error, { unique: 'Ya existe una categoría con esa URL (slug).' }) }
  revalidateCatalog()
  return { ok: true, message: input.id ? 'Categoría actualizada.' : 'Categoría creada.' }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) {
    return { ok: false, message: friendly(error, { inUse: 'Hay productos en esta categoría. Muévelos a otra antes de borrarla.' }) }
  }
  revalidateCatalog()
  return { ok: true, message: 'Categoría eliminada.' }
}

export async function saveSubcategory(input: TaxonomyInput & { category_id: string }): Promise<ActionResult> {
  const { supabase } = await requireAdmin()
  const fieldErrors = validateTaxonomy(input)
  if (Object.keys(fieldErrors).length) return { ok: false, message: 'Revisa los campos marcados.', fieldErrors }

  const values = {
    category_id: input.category_id,
    name: input.name.trim(),
    slug: input.slug.trim(),
    sort_order: Math.round(input.sort_order ?? 0) || 0,
  }
  const { error } = input.id
    ? await supabase.from('subcategories').update(values).eq('id', input.id)
    : await supabase.from('subcategories').insert(values)

  if (error) return { ok: false, message: friendly(error, { unique: 'Esta categoría ya tiene una subcategoría con esa URL.' }) }
  revalidateCatalog()
  return { ok: true, message: input.id ? 'Subcategoría actualizada.' : 'Subcategoría creada.' }
}

/** Los productos que la usaban se quedan sin subcategoría (no se borran). */
export async function deleteSubcategory(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('subcategories').delete().eq('id', id)
  if (error) return { ok: false, message: friendly(error) }
  revalidateCatalog()
  return { ok: true, message: 'Subcategoría eliminada.' }
}

// ---------------------------------------------------------------------------------------------
// Colecciones
// ---------------------------------------------------------------------------------------------

export async function saveCollection(
  input: TaxonomyInput & { image_url: string; is_active: boolean },
): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireAdmin()
  const fieldErrors = validateTaxonomy(input)
  if (Object.keys(fieldErrors).length) return { ok: false, message: 'Revisa los campos marcados.', fieldErrors }

  const values = {
    name: input.name.trim(),
    slug: input.slug.trim(),
    description: nullable(input.description ?? ''),
    image_url: nullable(input.image_url),
    is_active: input.is_active,
    sort_order: Math.round(input.sort_order ?? 0) || 0,
  }
  // Si cambió la foto, la anterior se borra del bucket para no acumular archivos huérfanos
  const previous = input.id
    ? (await supabase.from('collections').select('image_url').eq('id', input.id).single()).data?.image_url ?? null
    : null

  const { data, error } = input.id
    ? await supabase.from('collections').update(values).eq('id', input.id).select('id').single()
    : await supabase.from('collections').insert(values).select('id').single()

  if (error) return { ok: false, message: friendly(error, { unique: 'Ya existe una colección con esa URL (slug).' }) }

  const oldPath = previous && previous !== values.image_url ? storagePathFromUrl(previous, BUCKET) : null
  if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath])

  revalidateCatalog()
  return { ok: true, message: input.id ? 'Colección actualizada.' : 'Colección creada.', data: { id: data.id } }
}

/** Los productos de la colección se quedan sin colección (no se borran). */
export async function deleteCollection(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase.from('collections').delete().eq('id', id).select('image_url').single()
  if (error) return { ok: false, message: friendly(error) }

  const path = data.image_url ? storagePathFromUrl(data.image_url, BUCKET) : null
  if (path) await supabase.storage.from(BUCKET).remove([path])

  revalidateCatalog()
  return { ok: true, message: 'Colección eliminada.' }
}
