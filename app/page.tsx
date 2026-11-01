import Catalog, { type CatalogItem } from '@/components/landing/Catalog'
import Footer from '@/components/landing/Footer'
import Hero from '@/components/landing/Hero'
import Philosophy from '@/components/landing/Philosophy'
import SmoothScroll from '@/components/landing/SmoothScroll'
import { createClient } from '@/utils/supabase/server'

// Solo en desarrollo: en producción un catálogo vacío nunca debe mostrar piezas inventadas
const SAMPLE_ITEMS: CatalogItem[] = [
  { id: 'obsidian-coil', name: 'Obsidian Coil', price: '$420' },
  { id: 'void-arc', name: 'Void Arc', price: '$380' },
  { id: 'still-band', name: 'Still Band', price: '$310' },
  { id: 'null-signet', name: 'Null Signet', price: '$540' },
  { id: 'meridian-loop', name: 'Meridian Loop', price: '$460' },
  { id: 'hollow-orbit', name: 'Hollow Orbit', price: '$395' },
]

export default async function Home() {
  const supabase = await createClient()

  // Extraemos solo los productos que tengan is_active en true
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      product_variants (price)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) console.error('No se pudo cargar el catálogo:', error.message)

  const items: CatalogItem[] = (products ?? []).map((product) => {
    // Buscamos el precio más bajo entre todas sus variantes para mostrar "From $X"
    const prices = product.product_variants.map((v: { price: number }) => v.price)
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0

    return {
      id: product.id,
      name: product.title,
      slug: product.slug,
      price: minPrice > 0 ? `From $${minPrice.toLocaleString('en-US')}` : 'Price unavailable',
      imageUrl: (product as { image_url?: string | null }).image_url,
    }
  })

  const showSamples = items.length === 0 && process.env.NODE_ENV === 'development'

  return (
    <SmoothScroll>
      <main className="bg-white font-sans text-neutral-950">
        <Hero />
        <Catalog items={showSamples ? SAMPLE_ITEMS : items} />
        <Philosophy />
        <Footer />
      </main>
    </SmoothScroll>
  )
}
