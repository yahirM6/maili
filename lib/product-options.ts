// Lógica de selección de variantes, sin React: qué metales y tallas existen, cuáles hay en stock
// y qué variante corresponde a la elección del cliente.

export interface OptionVariant {
  id: string
  material: string
  size: string | null
  price: number
  stock_quantity: number
}

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL']

/** Tallas en orden natural: 5 < 5.5 < 10, XS < S < M, el resto alfabético. */
export function compareSizes(a: string, b: string) {
  const na = Number(a.replace(',', '.'))
  const nb = Number(b.replace(',', '.'))
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
  const ia = SIZE_ORDER.indexOf(a.toUpperCase())
  const ib = SIZE_ORDER.indexOf(b.toUpperCase())
  if (ia !== -1 && ib !== -1) return ia - ib
  return a.localeCompare(b, 'es', { numeric: true })
}

/** Metales en el orden en que se cargaron. */
export const materialsOf = <V extends OptionVariant>(variants: V[]) => [...new Set(variants.map((variant) => variant.material))]

/** Tallas de un metal con su disponibilidad; vacío si el producto no tiene tallas. */
export function sizesOf<V extends OptionVariant>(variants: V[], material: string) {
  const bySize = new Map<string, boolean>()
  for (const variant of variants) {
    if (variant.material !== material || !variant.size) continue
    bySize.set(variant.size, (bySize.get(variant.size) ?? false) || variant.stock_quantity > 0)
  }
  return [...bySize.entries()].sort(([a], [b]) => compareSizes(a, b)).map(([size, inStock]) => ({ size, inStock }))
}

export const materialInStock = <V extends OptionVariant>(variants: V[], material: string) =>
  variants.some((variant) => variant.material === material && variant.stock_quantity > 0)

/** La variante elegida (si la talla aplica); con stock primero si hay varias (p. ej. distinta piedra). */
export function findVariant<V extends OptionVariant>(variants: V[], material: string, size: string | null) {
  const matches = variants.filter((variant) => variant.material === material && (variant.size ?? null) === (size ?? null))
  return matches.find((variant) => variant.stock_quantity > 0) ?? matches[0] ?? null
}

/** Elección inicial: la primera variante con stock (o la primera, si todo está agotado). */
export function initialSelection<V extends OptionVariant>(variants: V[]) {
  const first = variants.find((variant) => variant.stock_quantity > 0) ?? variants[0]
  return { material: first?.material ?? '', size: first?.size ?? null }
}

/** Al cambiar de metal se conserva la talla si existe en el nuevo metal; si no, la primera con stock. */
export function sizeForMaterial<V extends OptionVariant>(variants: V[], material: string, currentSize: string | null) {
  const sizes = sizesOf(variants, material)
  if (sizes.length === 0) return null
  if (currentSize && sizes.some((option) => option.size === currentSize)) return currentSize
  return (sizes.find((option) => option.inStock) ?? sizes[0]).size
}

export function priceRange<V extends OptionVariant>(variants: V[]) {
  const prices = variants.map((variant) => Number(variant.price))
  return prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null
}
