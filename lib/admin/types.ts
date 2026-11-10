import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']

export type Category = Tables['categories']['Row']
export type Subcategory = Tables['subcategories']['Row']
export type Collection = Tables['collections']['Row']
export type Product = Tables['products']['Row']
export type Variant = Tables['product_variants']['Row']
export type ProductImage = Tables['product_images']['Row']

export type CategoryWithSubs = Category & { subcategories: Subcategory[] }

/** Lo que devuelve cada server action: la UI muestra `message` y marca los campos de `fieldErrors`. */
export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

export interface ProductInput {
  title: string
  slug: string
  description: string
  details: string
  category_id: string
  subcategory_id: string
  collection_id: string
  is_active: boolean
  is_featured: boolean
  sort_order: number
  allow_engraving: boolean
  max_engraving_chars: number
}

/** Una fila de la tabla de variantes del formulario; sin id = variante nueva. */
export interface VariantInput {
  id?: string
  material: string
  size: string
  gemstone: string
  price: number
  stock_quantity: number
  sku: string
}
