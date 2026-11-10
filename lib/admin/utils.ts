/** "Anillo Aurora Ñ" → "anillo-aurora-n" */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const isSlug = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)

export const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(value)

/** Ruta del archivo dentro del bucket a partir de su URL pública (para poder borrarlo). */
export function storagePathFromUrl(url: string, bucket = 'products') {
  const marker = `/storage/v1/object/public/${bucket}/`
  const index = url.indexOf(marker)
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length))
}

/** SKU legible y estable: SLUG-METAL-TALLA (ej. WAVE-RING-GOLD-7) */
export function buildSku(slug: string, material: string, size: string) {
  return [slug, material, size]
    .filter(Boolean)
    .map((part) => slugify(part).toUpperCase())
    .join('-')
}
