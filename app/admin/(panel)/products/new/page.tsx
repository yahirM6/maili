import type { Metadata } from 'next'
import Link from 'next/link'
import NewProductForm from '@/components/admin/NewProductForm'
import { PageHeader } from '@/components/admin/ui'
import { getTaxonomy } from '@/lib/admin/queries'

export const metadata: Metadata = { title: 'Nuevo producto' }

export default async function NewProductPage() {
  const { categories } = await getTaxonomy()

  return (
    <div className="max-w-2xl">
      <PageHeader
        back={
          <Link href="/admin" className="mb-2 inline-block text-sm text-neutral-500 hover:text-neutral-900">
            ← Productos
          </Link>
        }
        title="Nuevo producto"
        description="Empieza con lo básico. En el siguiente paso agregas fotos, variantes y precios; se guarda como borrador hasta que lo publiques."
      />
      <NewProductForm categories={categories} />
    </div>
  )
}
