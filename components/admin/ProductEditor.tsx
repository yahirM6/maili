'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import ImageManager from '@/components/admin/ImageManager'
import { useToast } from '@/components/admin/Toaster'
import { Badge, Button, buttonClass, Card, Field, Input, Select, Textarea, Toggle } from '@/components/admin/ui'
import VariantEditor from '@/components/admin/VariantEditor'
import { deleteProduct, saveProduct } from '@/lib/admin/actions'
import type { ProductWithRelations } from '@/lib/admin/queries'
import type { CategoryWithSubs, Collection, ProductInput, VariantInput } from '@/lib/admin/types'
import { slugify } from '@/lib/admin/utils'

interface Props {
  product: ProductWithRelations
  taxonomy: { categories: CategoryWithSubs[]; collections: Collection[] }
  knownMaterials: string[]
}

const toInput = (product: ProductWithRelations): ProductInput => ({
  title: product.title,
  slug: product.slug,
  description: product.description ?? '',
  details: product.details ?? '',
  category_id: product.category_id ?? '',
  subcategory_id: product.subcategory_id ?? '',
  collection_id: product.collection_id ?? '',
  is_active: !!product.is_active,
  is_featured: product.is_featured,
  sort_order: product.sort_order,
  allow_engraving: !!product.allow_engraving,
  max_engraving_chars: product.max_engraving_chars ?? 0,
})

const toVariants = (product: ProductWithRelations): VariantInput[] =>
  product.product_variants.map((variant) => ({
    id: variant.id,
    material: variant.material,
    size: variant.size ?? '',
    gemstone: variant.gemstone ?? '',
    price: Number(variant.price),
    stock_quantity: variant.stock_quantity,
    sku: variant.sku,
  }))

export default function ProductEditor({ product, taxonomy, knownMaterials }: Props) {
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [deleting, startDelete] = useTransition()

  const [form, setForm] = useState<ProductInput>(() => toInput(product))
  const [variants, setVariants] = useState<VariantInput[]>(() => toVariants(product))
  // Lo último guardado: sirve para saber si hay cambios pendientes
  const [saved, setSaved] = useState(() => JSON.stringify([toInput(product), toVariants(product)]))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const dirty = JSON.stringify([form, variants]) !== saved
  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => setForm((current) => ({ ...current, [key]: value }))

  const subcategories = useMemo(
    () => taxonomy.categories.find((category) => category.id === form.category_id)?.subcategories ?? [],
    [taxonomy.categories, form.category_id],
  )
  const materials = useMemo(
    () => [...new Set([...knownMaterials, ...variants.map((variant) => variant.material.trim()).filter(Boolean)])].sort(),
    [knownMaterials, variants],
  )

  // Avisa antes de salir con cambios sin guardar
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const save = () =>
    startTransition(async () => {
      const result = await saveProduct(product.id, form, variants)
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        toast(result.message, 'error')
        return
      }
      const nextVariants = result.data?.variants ?? []
      setVariants(nextVariants)
      setSaved(JSON.stringify([form, nextVariants]))
      setErrors({})
      toast(result.message ?? 'Guardado.')
    })

  const remove = () => {
    if (!window.confirm(`¿Borrar "${product.title}"? Se eliminan también sus fotos y variantes. No se puede deshacer.`)) return
    startDelete(async () => {
      const result = await deleteProduct(product.id)
      // Si sale bien, la action redirige a la lista
      if (!result.ok) toast(result.message, 'error')
    })
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
    >
      {/* Barra superior fija: siempre a mano el estado y el botón de guardar */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-[#f6f5f3]/95 px-4 py-3 backdrop-blur md:-mx-10 md:px-10">
        <div className="min-w-0">
          <Link href="/admin" className="text-xs text-neutral-500 hover:text-neutral-900">
            ← Productos
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight">{form.title || 'Sin nombre'}</h1>
            {form.is_active ? <Badge tone="green">Activo</Badge> : <Badge>Borrador</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs text-amber-700">Cambios sin guardar</span>}
          {product.is_active && (
            <a href={`/products/${product.slug}`} target="_blank" rel="noreferrer" className={buttonClass('ghost')}>
              Ver en tienda ↗
            </a>
          )}
          <Button type="submit" variant="primary" disabled={pending || !dirty}>
            {pending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6">
          <Card title="Información">
            <div className="grid gap-5">
              <Field label="Nombre" htmlFor="title" error={errors.title}>
                <Input id="title" value={form.title} invalid={!!errors.title} onChange={(event) => set('title', event.target.value)} />
              </Field>
              <Field
                label="URL"
                htmlFor="slug"
                error={errors.slug}
                hint={
                  form.slug !== product.slug && product.is_active
                    ? 'Ojo: si cambias la URL, los enlaces que ya compartiste dejarán de funcionar.'
                    : `/products/${form.slug || '…'}`
                }
              >
                <div className="flex gap-2">
                  <Input id="slug" value={form.slug} invalid={!!errors.slug} onChange={(event) => set('slug', slugify(event.target.value))} />
                  <Button size="md" variant="ghost" onClick={() => set('slug', slugify(form.title))} title="Generar desde el nombre">
                    ↺
                  </Button>
                </div>
              </Field>
              <Field label="Descripción" htmlFor="description" hint="El texto principal que se lee junto a las fotos.">
                <Textarea id="description" rows={5} value={form.description} onChange={(event) => set('description', event.target.value)} />
              </Field>
              <Field
                label="Detalles del producto"
                htmlFor="details"
                hint="Va en la pestaña “Product details”: materiales, medidas, cuidados. Un dato por línea."
              >
                <Textarea
                  id="details"
                  rows={4}
                  value={form.details}
                  placeholder={'Oro de 18k sobre plata 925\nAncho: 3 mm\nNo sumergir en agua con cloro'}
                  onChange={(event) => set('details', event.target.value)}
                />
              </Field>
            </div>
          </Card>

          <ImageManager
            key={product.product_images.map((image) => `${image.id}:${image.display_order}:${image.material}`).join('|')}
            productId={product.id}
            productTitle={form.title}
            images={product.product_images}
            materials={materials}
          />

          <VariantEditor
            variants={variants}
            onChange={setVariants}
            errors={errors}
            materials={materials}
            slug={form.slug}
          />
        </div>

        <div className="grid content-start gap-6">
          <Card title="Estado">
            <div className="grid gap-4">
              <Toggle
                id="is_active"
                checked={form.is_active}
                onChange={(value) => set('is_active', value)}
                label="Publicado"
                description={form.is_active ? 'Visible en la tienda.' : 'Borrador: solo tú lo ves.'}
              />
              <Toggle
                id="is_featured"
                checked={form.is_featured}
                onChange={(value) => set('is_featured', value)}
                label="Destacado"
                description="Aparece primero en la home y en su categoría."
              />
            </div>
          </Card>

          <Card title="Organización">
            <div className="grid gap-4">
              <Field label="Categoría" htmlFor="category_id">
                <Select
                  id="category_id"
                  value={form.category_id}
                  onChange={(event) => {
                    const categoryId = event.target.value
                    const keepsSub = taxonomy.categories
                      .find((category) => category.id === categoryId)
                      ?.subcategories.some((sub) => sub.id === form.subcategory_id)
                    setForm((current) => ({ ...current, category_id: categoryId, subcategory_id: keepsSub ? current.subcategory_id : '' }))
                  }}
                >
                  <option value="">Sin categoría</option>
                  {taxonomy.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Subcategoría"
                htmlFor="subcategory_id"
                hint={
                  form.category_id && subcategories.length === 0 ? (
                    <>
                      Esta categoría no tiene subcategorías. <Link className="underline" href="/admin/categories">Crear</Link>
                    </>
                  ) : undefined
                }
              >
                <Select
                  id="subcategory_id"
                  value={form.subcategory_id}
                  disabled={subcategories.length === 0}
                  onChange={(event) => set('subcategory_id', event.target.value)}
                >
                  <option value="">Ninguna</option>
                  {subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Colección" htmlFor="collection_id">
                <Select id="collection_id" value={form.collection_id} onChange={(event) => set('collection_id', event.target.value)}>
                  <option value="">Ninguna</option>
                  {taxonomy.collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                      {collection.is_active ? '' : ' (oculta)'}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Orden" htmlFor="sort_order" hint="Número menor = aparece antes. Empates: el más nuevo primero.">
                <Input
                  id="sort_order"
                  type="number"
                  value={form.sort_order}
                  onChange={(event) => set('sort_order', Number(event.target.value) || 0)}
                />
              </Field>
            </div>
          </Card>

          <Card title="Grabado personalizado">
            <div className="grid gap-4">
              <Toggle
                id="allow_engraving"
                checked={form.allow_engraving}
                onChange={(value) => set('allow_engraving', value)}
                label="Permitir grabado"
                description="El cliente escribe un texto al comprar."
              />
              {form.allow_engraving && (
                <Field label="Máximo de caracteres" htmlFor="max_engraving_chars" error={errors.max_engraving_chars}>
                  <Input
                    id="max_engraving_chars"
                    type="number"
                    min={1}
                    max={100}
                    value={form.max_engraving_chars || ''}
                    invalid={!!errors.max_engraving_chars}
                    onChange={(event) => set('max_engraving_chars', Number(event.target.value) || 0)}
                  />
                </Field>
              )}
            </div>
          </Card>

          <Card title="Eliminar producto">
            <p className="mb-4 text-xs text-neutral-500">
              Borra el producto con sus fotos y variantes. Si ya tiene pedidos no se puede borrar: pásalo a borrador.
            </p>
            <Button variant="danger" onClick={remove} disabled={deleting}>
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </Card>
        </div>
      </div>
    </form>
  )
}
