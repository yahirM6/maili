import { requireAdmin } from '@/lib/admin/auth'
import type { CategoryWithSubs, Collection } from '@/lib/admin/types'

export interface ProductFilters {
  q?: string
  category?: string
  status?: 'active' | 'draft'
}

/** Lista del inventario con lo necesario para la tabla: foto, precios, stock y clasificación. */
export async function listProducts(filters: ProductFilters) {
  const { supabase } = await requireAdmin()

  let query = supabase
    .from('products')
    .select(
      `id, title, slug, is_active, is_featured, sort_order, created_at,
       categories (name), subcategories (name), collections (name),
       product_variants (price, stock_quantity),
       product_images (url, display_order)`,
    )
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .order('display_order', { referencedTable: 'product_images', ascending: true })

  // Comas, paréntesis y % tienen significado en los filtros de PostgREST
  const q = filters.q?.replace(/[%,()]/g, ' ').trim()
  if (q) query = query.ilike('title', `%${q}%`)
  if (filters.category) query = query.eq('category_id', filters.category)
  if (filters.status) query = query.eq('is_active', filters.status === 'active')

  const { data, error } = await query
  if (error) throw new Error(`No se pudo cargar el inventario: ${error.message}`)
  return data
}

export type ProductListItem = Awaited<ReturnType<typeof listProducts>>[number]

export async function getProduct(id: string) {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase
    .from('products')
    .select('*, product_variants (*), product_images (*)')
    .eq('id', id)
    .order('created_at', { referencedTable: 'product_variants', ascending: true })
    .order('display_order', { referencedTable: 'product_images', ascending: true })
    .maybeSingle()

  if (error) throw new Error(`No se pudo cargar el producto: ${error.message}`)
  return data
}

export type ProductWithRelations = NonNullable<Awaited<ReturnType<typeof getProduct>>>

/** Categorías con sus subcategorías y colecciones: alimentan los selects y sus pantallas. */
export async function getTaxonomy() {
  const { supabase } = await requireAdmin()
  const [categories, collections] = await Promise.all([
    supabase
      .from('categories')
      .select('*, subcategories (*)')
      .order('sort_order')
      .order('name')
      .order('sort_order', { referencedTable: 'subcategories' })
      .order('name', { referencedTable: 'subcategories' }),
    supabase.from('collections').select('*').order('sort_order').order('name'),
  ])

  if (categories.error) throw new Error(`No se pudieron cargar las categorías: ${categories.error.message}`)
  if (collections.error) throw new Error(`No se pudieron cargar las colecciones: ${collections.error.message}`)

  return {
    categories: categories.data as CategoryWithSubs[],
    collections: collections.data as Collection[],
  }
}

/** Cuántos productos usa cada categoría/colección: para avisar antes de borrar. */
export async function getUsageCounts() {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase.from('products').select('category_id, subcategory_id, collection_id')
  if (error) throw new Error(error.message)

  const count = (key: 'category_id' | 'subcategory_id' | 'collection_id') =>
    data.reduce<Record<string, number>>((acc, row) => {
      const id = row[key]
      if (id) acc[id] = (acc[id] ?? 0) + 1
      return acc
    }, {})

  return { categories: count('category_id'), subcategories: count('subcategory_id'), collections: count('collection_id') }
}

/** Metales ya usados en variantes: sugerencias al escribir uno nuevo. */
export async function getKnownMaterials() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('product_variants').select('material')
  return [...new Set((data ?? []).map((row) => row.material).filter(Boolean))].sort()
}
