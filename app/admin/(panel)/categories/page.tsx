import type { Metadata } from 'next'
import CategoriesManager from '@/components/admin/CategoriesManager'
import { PageHeader } from '@/components/admin/ui'
import { getTaxonomy, getUsageCounts } from '@/lib/admin/queries'

export const metadata: Metadata = { title: 'Categorías' }

export default async function CategoriesPage() {
  const [{ categories }, usage] = await Promise.all([getTaxonomy(), getUsageCounts()])

  return (
    <>
      <PageHeader
        title="Categorías"
        description="Las secciones de la tienda (Rings, Earrings…) y sus subcategorías, que aparecen como filtros rápidos (Hoops, Studs…)."
      />
      <CategoriesManager categories={categories} usage={usage} />
    </>
  )
}
