import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Footer from '@/components/landing/Footer'
import ProductCarousel from '@/components/landing/ProductCarousel'
import SiteHeader from '@/components/landing/SiteHeader'
import SmoothScroll from '@/components/landing/SmoothScroll'
import Breadcrumbs from '@/components/product/Breadcrumbs'
import ProductView from '@/components/product/ProductView'
import { getProduct, getRelatedProducts } from '@/lib/catalog'
import { priceRange } from '@/lib/product-options'
import { CURRENCY } from '@/lib/store-content'

type Params = Promise<{ slug: string }>

// Sin cookies (cliente público): cada producto se genera la primera vez que se visita y queda en caché.
// Las acciones del admin la renuevan al guardar; la hora es solo un respaldo.
export const revalidate = 3600
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProduct((await params).slug)
  if (!product) return { title: 'Product not found · Maili' }

  const description = product.description?.slice(0, 160) ?? `${product.title} — fine jewellery by Maili.`
  const image = product.product_images[0]?.url
  return {
    title: `${product.title} · Maili`,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.title, description, type: 'website', images: image ? [{ url: image }] : undefined },
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const related = await getRelatedProducts(product)
  const category = product.categories

  // Datos estructurados: Google muestra precio y disponibilidad en los resultados
  const range = priceRange(product.product_variants)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description ?? undefined,
    image: product.product_images.map((image) => image.url),
    brand: { '@type': 'Brand', name: 'Maili' },
    offers: range && {
      '@type': 'AggregateOffer',
      priceCurrency: CURRENCY,
      lowPrice: range.min,
      highPrice: range.max,
      offerCount: product.product_variants.length,
      availability: product.product_variants.some((variant) => variant.stock_quantity > 0)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  }

  return (
    <SmoothScroll>
      <SiteHeader variant="page" />
      {/* z-10 y fondo propio: tapa al footer, que se destapa al final (igual que en la home) */}
      <main className="relative z-10 bg-background font-sans text-foreground">
        <div className="mx-auto max-w-[1800px] px-5 pb-8 pt-[84px] md:px-[60px] md:pt-[110px]">
          <div className="mb-5 md:mb-7">
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Catalog', href: '/catalog' },
                ...(category ? [{ label: category.name, href: `/catalog/${category.slug}` }] : []),
                { label: product.title },
              ]}
            />
          </div>
          <ProductView product={product} />
        </div>

        {related.length > 0 && <ProductCarousel variant="inline" title="You may also like" products={related} />}
      </main>
      <Footer />

      <script
        type="application/ld+json"
        // JSON.stringify no escapa "<": se reemplaza para que un texto con </script> no rompa la página
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </SmoothScroll>
  )
}
