import { cache } from 'react'
import type { Product as CardProduct } from '@/lib/home-data'
import { createPublicClient } from '@/utils/supabase/public'

// Consultas de la tienda (lo que ve el cliente). Siempre filtran productos activos además de RLS.

export async function getProductBySlug(slug: string) {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('products')
    .select(
      `id, title, slug, description, details, allow_engraving, max_engraving_chars, category_id,
       categories (name, slug), subcategories (name, slug), collections (name, slug),
       product_variants (id, material, size, gemstone, price, stock_quantity),
       product_images (id, url, alt_text, material, display_order)`,
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .order('display_order', { referencedTable: 'product_images', ascending: true })
    .order('created_at', { referencedTable: 'product_variants', ascending: true })
    .maybeSingle()

  if (error) throw new Error(`No se pudo cargar el producto: ${error.message}`)
  return data
}

/** Misma consulta para la página y sus metadatos, en una sola petición por render. */
export const getProduct = cache(getProductBySlug)

export type StoreProduct = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>
export type StoreVariant = StoreProduct['product_variants'][number]
export type StoreImage = StoreProduct['product_images'][number]

/** Formato de las tarjetas de producto (carruseles, cuadrícula). */
function toCard(product: {
  id: string
  title: string
  slug: string
  product_variants: { price: number }[]
  product_images: { url: string }[]
}): CardProduct | null {
  const image = product.product_images[0]?.url
  if (!image || product.product_variants.length === 0) return null
  return {
    id: product.id,
    name: product.title,
    price: Math.min(...product.product_variants.map((variant) => Number(variant.price))),
    image,
    href: `/products/${product.slug}`,
    fit: 'contain',
  }
}

/** "También te puede gustar": primero de la misma categoría, luego destacados, sin repetir el actual. */
export async function getRelatedProducts(product: { id: string; category_id: string | null }, limit = 8) {
  const supabase = createPublicClient()
  const select = 'id, title, slug, product_variants (price), product_images (url, display_order)'

  const load = async (categoryId?: string) => {
    let query = supabase.from('products').select(select).eq('is_active', true).neq('id', product.id)
    if (categoryId) query = query.eq('category_id', categoryId)
    const { data } = await query
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .order('display_order', { referencedTable: 'product_images', ascending: true })
      .limit(limit)
    return data ?? []
  }

  const [sameCategory, others] = await Promise.all([product.category_id ? load(product.category_id) : [], load()])

  const seen = new Set<string>()
  return [...sameCategory, ...others]
    .filter((item) => !seen.has(item.id) && seen.add(item.id))
    .map(toCard)
    .filter((item): item is CardProduct => item !== null)
    .slice(0, limit)
}
