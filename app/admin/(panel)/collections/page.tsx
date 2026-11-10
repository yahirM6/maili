import type { Metadata } from 'next'
import CollectionsManager from '@/components/admin/CollectionsManager'
import { PageHeader } from '@/components/admin/ui'
import { getTaxonomy, getUsageCounts } from '@/lib/admin/queries'

export const metadata: Metadata = { title: 'Colecciones' }

export default async function CollectionsPage() {
  const [{ collections }, usage] = await Promise.all([getTaxonomy(), getUsageCounts()])

  return (
    <>
      <PageHeader
        title="Colecciones"
        description="Agrupan piezas de distintas categorías (Molten, Deia…). Aparecen como bloques destacados en la home y en el catálogo."
      />
      <CollectionsManager collections={collections} usage={usage.collections} />
    </>
  )
}
