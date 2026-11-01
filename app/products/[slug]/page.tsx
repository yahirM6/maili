import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import VariantSelector from './VariantSelector'

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  // Resolvemos los parámetros dinámicos (Next.js 15 compatible)
  const resolvedParams = await params
  const slug = resolvedParams.slug
  const supabase = await createClient()

  // Buscamos el producto y cruzamos los datos con sus variantes
  const { data: product, error } = await supabase
    .from('products')
    .select('*, product_variants (*)')
    .eq('slug', slug)
    .eq('is_active', true) // Doble seguridad: no mostramos productos inactivos
    .single()

  if (error || !product) {
    notFound()
  }

  // La imagen ya es type-safe gracias a tu comando de Supabase
  const imageUrl = product.image_url

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-100 py-6 text-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <Link href="/" className="text-2xl font-light tracking-widest uppercase text-gray-900 hover:text-gray-600 transition-colors">
          Tu Joyería
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link href="/" className="text-sm text-gray-500 hover:text-black mb-8 inline-block">
          ← Volver al catálogo
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Columna Izquierda: Fotografía */}
          <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                Sin foto disponible
              </div>
            )}
          </div>

          {/* Columna Derecha: Detalles y Opciones */}
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl font-medium text-gray-900 mb-2">{product.title}</h1>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Una pieza exclusiva de nuestra colección, diseñada con los más altos estándares de calidad.
            </p>

            {/* INYECTAMOS TU COMPONENTE DE CLIENTE INTERACTIVO AQUÍ */}
            <VariantSelector 
              variants={product.product_variants} 
              allowEngraving={product.allow_engraving} 
              productTitle={product.title} 
            />
          </div>
        </div>
      </div>
    </main>
  )
}