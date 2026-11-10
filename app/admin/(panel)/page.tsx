import Image from 'next/image'
import Link from 'next/link'
import { Badge, buttonClass, Card, EmptyState, Input, PageHeader, Select } from '@/components/admin/ui'
import { UrlToast } from '@/components/admin/Toaster'
import { getTaxonomy, listProducts, type ProductListItem } from '@/lib/admin/queries'
import { formatMoney } from '@/lib/admin/utils'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? ''

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const q = one(params.q)
  const category = one(params.category)
  const status = one(params.status)

  const [products, { categories }] = await Promise.all([
    listProducts({ q, category, status: status === 'active' || status === 'draft' ? status : undefined }),
    getTaxonomy(),
  ])
  const filtered = Boolean(q || category || status)

  return (
    <>
      <UrlToast message={params.borrado ? 'Producto eliminado.' : null} />
      <PageHeader
        title="Productos"
        description={`${products.length} ${products.length === 1 ? 'producto' : 'productos'}${filtered ? ' con estos filtros' : ''}`}
        actions={
          <Link href="/admin/products/new" className={buttonClass('primary')}>
            Nuevo producto
          </Link>
        }
      />

      <Card className="overflow-hidden" title={undefined}>
        {/* GET: los filtros viven en la URL, así se pueden recargar y compartir */}
        <form className="-mx-5 -mt-5 mb-0 flex flex-wrap items-center gap-2 border-b border-neutral-100 px-5 py-4">
          <Input name="q" defaultValue={q} placeholder="Buscar por nombre…" aria-label="Buscar" className="sm:w-auto! sm:min-w-56 sm:flex-1" />
          <Select name="category" defaultValue={category} aria-label="Categoría" className="sm:w-auto!">
            <option value="">Todas las categorías</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select name="status" defaultValue={status} aria-label="Estado" className="sm:w-auto!">
            <option value="">Activos y borradores</option>
            <option value="active">Solo activos</option>
            <option value="draft">Solo borradores</option>
          </Select>
          <button type="submit" className={buttonClass('secondary')}>
            Filtrar
          </button>
          {filtered && (
            <Link href="/admin" className={buttonClass('ghost')}>
              Limpiar
            </Link>
          )}
        </form>

        {products.length === 0 ? (
          filtered ? (
            <EmptyState title="Sin resultados" description="Ningún producto coincide con estos filtros." />
          ) : (
            <EmptyState
              title="Aún no hay productos"
              description="Crea el primero: empieza con el nombre y después agregas fotos y variantes."
              action={
                <Link href="/admin/products/new" className={buttonClass('primary')}>
                  Nuevo producto
                </Link>
              }
            />
          )
        ) : (
          <div className="-mx-5 -mb-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-100 text-xs text-neutral-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Producto</th>
                  <th className="hidden px-3 py-3 font-medium lg:table-cell">Clasificación</th>
                  <th className="hidden px-3 py-3 font-medium sm:table-cell">Precio</th>
                  <th className="hidden px-3 py-3 font-medium md:table-cell">Stock</th>
                  <th className="px-5 py-3 text-right font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((product) => (
                  <ProductRow key={product.id} product={product} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}

function ProductRow({ product }: { product: ProductListItem }) {
  const image = product.product_images[0]?.url
  const prices = product.product_variants.map((variant) => Number(variant.price))
  const stock = product.product_variants.reduce((total, variant) => total + variant.stock_quantity, 0)
  const min = prices.length ? Math.min(...prices) : null
  const max = prices.length ? Math.max(...prices) : null
  const href = `/admin/products/${product.id}`

  return (
    <tr className="group relative hover:bg-neutral-50">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-neutral-100">
            {image && <Image src={image} alt="" fill sizes="48px" className="object-cover" />}
          </div>
          <div className="min-w-0">
            {/* El enlace cubre toda la fila (after:inset-0) */}
            <Link href={href} className="font-medium text-neutral-900 after:absolute after:inset-0 group-hover:underline">
              {product.title}
            </Link>
            <p className="truncate text-xs text-neutral-500">/{product.slug}</p>
          </div>
        </div>
      </td>
      <td className="hidden px-3 py-3 text-neutral-600 lg:table-cell">
        {product.categories?.name ?? <span className="text-neutral-400">Sin categoría</span>}
        {product.subcategories?.name && <span className="text-neutral-400"> · {product.subcategories.name}</span>}
        {product.collections?.name && <p className="text-xs text-neutral-500">{product.collections.name}</p>}
      </td>
      <td className="hidden px-3 py-3 tabular-nums text-neutral-700 sm:table-cell">
        {min === null ? (
          <span className="text-neutral-400">—</span>
        ) : min === max ? (
          formatMoney(min)
        ) : (
          `${formatMoney(min)} – ${formatMoney(max!)}`
        )}
      </td>
      <td className="hidden px-3 py-3 tabular-nums md:table-cell">
        {product.product_variants.length === 0 ? (
          <span className="text-xs text-neutral-400">Sin variantes</span>
        ) : stock === 0 ? (
          <Badge tone="red">Agotado</Badge>
        ) : (
          <span className="text-neutral-700">
            {stock} <span className="text-xs text-neutral-400">en {product.product_variants.length} var.</span>
          </span>
        )}
      </td>
      <td className="px-5 py-3 text-right">
        <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:justify-end">
          {product.is_featured && <Badge tone="amber">Destacado</Badge>}
          {product.is_active ? <Badge tone="green">Activo</Badge> : <Badge>Borrador</Badge>}
        </div>
      </td>
    </tr>
  )
}
