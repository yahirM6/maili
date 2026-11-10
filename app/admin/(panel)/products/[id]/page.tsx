import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProductEditor from '@/components/admin/ProductEditor'
import { UrlToast } from '@/components/admin/Toaster'
import { getKnownMaterials, getProduct, getTaxonomy } from '@/lib/admin/queries'

type Params = Promise<{ id: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProduct((await params).id)
  return { title: product?.title ?? 'Producto' }
}

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  // Un id que no es uuid haría fallar la consulta: se trata como "no existe"
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const [product, taxonomy, materials, query] = await Promise.all([getProduct(id), getTaxonomy(), getKnownMaterials(), searchParams])
  if (!product) notFound()

  return (
    <>
      <UrlToast message={query.nuevo ? 'Producto creado. Agrega fotos y variantes, y publícalo cuando esté listo.' : null} />
      <ProductEditor product={product} taxonomy={taxonomy} knownMaterials={materials} />
    </>
  )
}
