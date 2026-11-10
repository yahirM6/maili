'use client'

import { useId, useState } from 'react'
import { Button, Card, Field, Input, cx } from '@/components/admin/ui'
import type { VariantInput } from '@/lib/admin/types'
import { buildSku } from '@/lib/admin/utils'

interface Props {
  variants: VariantInput[]
  onChange: (variants: VariantInput[]) => void
  errors: Record<string, string>
  materials: string[]
  slug: string
}

const empty = (base?: Partial<VariantInput>): VariantInput => ({
  material: '',
  size: '',
  gemstone: '',
  price: 0,
  stock_quantity: 0,
  sku: '',
  ...base,
})

const list = (value: string) =>
  value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)

/** Tabla editable: cada fila es una combinación vendible (metal + talla + piedra) con su precio y stock. */
export default function VariantEditor({ variants, onChange, errors, materials, slug }: Props) {
  const listId = useId()
  const [generator, setGenerator] = useState<null | { metals: string; sizes: string; price: string; stock: string }>(null)

  const update = (index: number, changes: Partial<VariantInput>) =>
    onChange(variants.map((variant, i) => (i === index ? { ...variant, ...changes } : variant)))

  const remove = (index: number) => onChange(variants.filter((_, i) => i !== index))

  // Crea todas las combinaciones metal × talla que falten (útil para anillos con muchas tallas)
  const generate = () => {
    if (!generator) return
    const metals = list(generator.metals)
    const sizes = list(generator.sizes)
    if (!metals.length) return
    const key = (material: string, size: string) => `${material.toLowerCase()}|${size.toLowerCase()}`
    const existing = new Set(variants.map((variant) => key(variant.material, variant.size)))
    const created = metals.flatMap((material) =>
      (sizes.length ? sizes : ['']).flatMap((size) =>
        existing.has(key(material, size))
          ? []
          : [empty({ material, size, price: Number(generator.price) || 0, stock_quantity: Math.max(0, Math.round(Number(generator.stock) || 0)) })],
      ),
    )
    onChange([...variants, ...created])
    setGenerator(null)
  }

  const totalStock = variants.reduce((total, variant) => total + (variant.stock_quantity || 0), 0)

  return (
    <Card
      title="Variantes"
      description={
        variants.length
          ? `${variants.length} ${variants.length === 1 ? 'variante' : 'variantes'} · ${totalStock} piezas en stock. Se guardan con el botón Guardar.`
          : 'Cada combinación de metal y talla que vendes, con su precio y stock.'
      }
      actions={
        <>
          <Button size="sm" variant="ghost" onClick={() => setGenerator(generator ? null : { metals: materials.join(', '), sizes: '', price: '', stock: '' })}>
            Generar combinaciones
          </Button>
          <Button size="sm" onClick={() => onChange([...variants, empty({ material: variants.at(-1)?.material ?? '', price: variants.at(-1)?.price ?? 0 })])}>
            Agregar
          </Button>
        </>
      }
    >
      <datalist id={listId}>
        {materials.map((material) => (
          <option key={material} value={material} />
        ))}
      </datalist>

      {generator && (
        <div className="mb-5 grid gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-2">
          <Field label="Metales" htmlFor="gen-metals" hint="Separados por coma.">
            <Input id="gen-metals" value={generator.metals} placeholder="Gold, Silver" onChange={(event) => setGenerator({ ...generator, metals: event.target.value })} />
          </Field>
          <Field label="Tallas" htmlFor="gen-sizes" hint="Separadas por coma. Vacío si no aplica.">
            <Input id="gen-sizes" value={generator.sizes} placeholder="5, 6, 7, 8" onChange={(event) => setGenerator({ ...generator, sizes: event.target.value })} />
          </Field>
          <Field label="Precio para todas" htmlFor="gen-price">
            <Input id="gen-price" type="number" min={0} step="0.01" value={generator.price} onChange={(event) => setGenerator({ ...generator, price: event.target.value })} />
          </Field>
          <Field label="Stock para cada una" htmlFor="gen-stock">
            <Input id="gen-stock" type="number" min={0} value={generator.stock} onChange={(event) => setGenerator({ ...generator, stock: event.target.value })} />
          </Field>
          <div className="flex items-center justify-between gap-3 sm:col-span-2">
            <p className="text-xs text-neutral-500">
              {(() => {
                const count = list(generator.metals).length * Math.max(1, list(generator.sizes).length)
                return count ? `Se crearán hasta ${count} variantes (las que ya existen no se repiten).` : 'Escribe al menos un metal.'
              })()}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setGenerator(null)}>
                Cancelar
              </Button>
              <Button size="sm" variant="primary" onClick={generate} disabled={!list(generator.metals).length}>
                Crear variantes
              </Button>
            </div>
          </div>
        </div>
      )}

      {variants.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-500">Sin variantes. Sin al menos una, el producto no se puede publicar.</p>
      ) : (
        <div className="-mx-5 -mb-5 overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="border-y border-neutral-100 bg-neutral-50 text-left text-xs text-neutral-500">
              <tr>
                <th className="py-2 pl-5 pr-2 font-medium">Metal</th>
                <th className="px-2 py-2 font-medium">Talla</th>
                <th className="px-2 py-2 font-medium">Piedra</th>
                <th className="w-28 px-2 py-2 font-medium">Precio</th>
                <th className="w-24 px-2 py-2 font-medium">Stock</th>
                <th className="w-44 px-2 py-2 font-medium">SKU</th>
                <th className="w-12 py-2 pl-2 pr-5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {variants.map((variant, index) => {
                const error = (field: string) => errors[`variants.${index}.${field}`]
                const rowError = ['material', 'size', 'price', 'stock_quantity'].map(error).find(Boolean)
                return (
                  <tr key={variant.id ?? `new-${index}`} className={cx(rowError && 'bg-red-50/50')}>
                    <td className="py-2 pl-5 pr-2 align-top">
                      <Input
                        aria-label={`Metal de la variante ${index + 1}`}
                        list={listId}
                        value={variant.material}
                        invalid={!!error('material')}
                        placeholder="Gold"
                        className="h-9"
                        onChange={(event) => update(index, { material: event.target.value })}
                      />
                      {rowError && <p className="mt-1 text-xs text-red-600">{rowError}</p>}
                    </td>
                    <td className="px-2 py-2 align-top">
                      <Input
                        aria-label={`Talla de la variante ${index + 1}`}
                        value={variant.size}
                        invalid={!!error('size')}
                        placeholder="—"
                        className="h-9"
                        onChange={(event) => update(index, { size: event.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2 align-top">
                      <Input
                        aria-label={`Piedra de la variante ${index + 1}`}
                        value={variant.gemstone}
                        placeholder="—"
                        className="h-9"
                        onChange={(event) => update(index, { gemstone: event.target.value })}
                      />
                    </td>
                    <td className="px-2 py-2 align-top">
                      <Input
                        aria-label={`Precio de la variante ${index + 1}`}
                        type="number"
                        min={0}
                        step="0.01"
                        value={Number.isFinite(variant.price) ? variant.price : ''}
                        invalid={!!error('price')}
                        className="h-9 tabular-nums"
                        onChange={(event) => update(index, { price: event.target.value === '' ? NaN : Number(event.target.value) })}
                      />
                    </td>
                    <td className="px-2 py-2 align-top">
                      <Input
                        aria-label={`Stock de la variante ${index + 1}`}
                        type="number"
                        min={0}
                        step={1}
                        value={variant.stock_quantity}
                        invalid={!!error('stock_quantity')}
                        className={cx('h-9 tabular-nums', variant.stock_quantity === 0 && 'text-red-600')}
                        onChange={(event) => update(index, { stock_quantity: Number(event.target.value) })}
                      />
                    </td>
                    <td className="px-2 py-2 align-top">
                      <Input
                        aria-label={`SKU de la variante ${index + 1}`}
                        value={variant.sku}
                        title={variant.sku || undefined}
                        placeholder={buildSku(slug, variant.material, variant.size) || 'Automático'}
                        className="h-9 font-mono text-xs"
                        onChange={(event) => update(index, { sku: event.target.value.toUpperCase() })}
                      />
                    </td>
                    <td className="py-2 pl-2 pr-5 align-top">
                      <Button size="sm" variant="ghost" aria-label={`Quitar la variante ${index + 1}`} title="Quitar" onClick={() => remove(index)} className="h-9 px-2">
                        ✕
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
