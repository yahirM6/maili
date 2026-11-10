'use client'

import Image from 'next/image'
import { useRef, useState, useTransition, type FormEvent } from 'react'
import { useToast } from '@/components/admin/Toaster'
import { Badge, Button, Card, EmptyState, Field, Input, Textarea, Toggle } from '@/components/admin/ui'
import { deleteCollection, saveCollection } from '@/lib/admin/actions'
import type { Collection } from '@/lib/admin/types'
import { ACCEPT_ATTR, checkImage, uploadImage } from '@/lib/admin/upload'
import { slugify } from '@/lib/admin/utils'

interface Props {
  collections: Collection[]
  usage: Record<string, number>
}

export default function CollectionsManager({ collections, usage }: Props) {
  // null = cerrado; 'new' = creando; o la colección que se edita
  const [editing, setEditing] = useState<Collection | 'new' | null>(collections.length ? null : 'new')

  return (
    <div className="grid gap-6">
      {editing ? (
        <CollectionForm
          key={editing === 'new' ? 'new' : editing.id}
          collection={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          canCancel={collections.length > 0}
        />
      ) : (
        <div>
          <Button variant="primary" onClick={() => setEditing('new')}>
            Nueva colección
          </Button>
        </div>
      )}

      {collections.length === 0 && !editing && <EmptyState title="Aún no hay colecciones" />}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {collections.map((collection) => (
          <li key={collection.id} className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <div className="relative aspect-[4/3] bg-neutral-100">
              {collection.image_url ? (
                <Image src={collection.image_url} alt="" fill sizes="(min-width: 1280px) 33vw, 50vw" className="object-cover" />
              ) : (
                <span className="absolute inset-0 grid place-items-center text-xs text-neutral-400">Sin foto</span>
              )}
            </div>
            <div className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium">{collection.name}</p>
                <p className="text-xs text-neutral-500">
                  {usage[collection.id] ?? 0} {(usage[collection.id] ?? 0) === 1 ? 'producto' : 'productos'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {collection.is_active ? <Badge tone="green">Visible</Badge> : <Badge>Oculta</Badge>}
                <Button size="sm" variant="ghost" onClick={() => setEditing(collection)}>
                  Editar
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CollectionForm({ collection, onClose, canCancel }: { collection?: Collection; onClose: () => void; canCancel: boolean }) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [values, setValues] = useState({
    name: collection?.name ?? '',
    slug: collection?.slug ?? '',
    description: collection?.description ?? '',
    image_url: collection?.image_url ?? '',
    is_active: collection?.is_active ?? true,
    sort_order: collection?.sort_order ?? 0,
  })

  const pickImage = async (file?: File) => {
    if (!file) return
    const problem = checkImage(file)
    if (problem) return toast(problem, 'error')
    setUploading(true)
    try {
      const url = await uploadImage(file, 'collections')
      setValues((current) => ({ ...current, image_url: url }))
    } catch (error) {
      toast(error instanceof Error ? error.message : 'No se pudo subir la foto.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    startTransition(async () => {
      const result = await saveCollection({ id: collection?.id, ...values })
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        toast(result.message, 'error')
        return
      }
      toast(result.message ?? 'Guardado.')
      onClose()
    })
  }

  const remove = () => {
    if (!collection) return
    if (!window.confirm(`¿Eliminar la colección "${collection.name}"? Sus productos no se borran, solo dejan de pertenecer a ella.`)) return
    startTransition(async () => {
      const result = await deleteCollection(collection.id)
      toast(result.ok ? result.message ?? 'Eliminada.' : result.message, result.ok ? 'success' : 'error')
      if (result.ok) onClose()
    })
  }

  return (
    <Card title={collection ? `Editar ${collection.name}` : 'Nueva colección'}>
      <form onSubmit={submit} className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
        <div>
          <p className="mb-1.5 text-xs font-medium text-neutral-700">Foto</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="relative block aspect-[4/5] w-full overflow-hidden rounded-md border-2 border-dashed border-neutral-300 bg-neutral-50 hover:border-neutral-400"
          >
            {values.image_url ? (
              <Image src={values.image_url} alt="" fill sizes="240px" className="object-cover" />
            ) : (
              <span className="absolute inset-0 grid place-items-center px-4 text-xs text-neutral-500">
                {uploading ? 'Subiendo…' : 'Elegir foto (vertical, 1600 px o más)'}
              </span>
            )}
          </button>
          <input ref={inputRef} type="file" accept={ACCEPT_ATTR} hidden onChange={(event) => pickImage(event.target.files?.[0])} />
          {values.image_url && (
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => inputRef.current?.click()} disabled={uploading}>
                Cambiar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setValues({ ...values, image_url: '' })}>
                Quitar
              </Button>
            </div>
          )}
        </div>

        <div className="grid content-start gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="col-name" error={errors.name}>
            <Input
              id="col-name"
              value={values.name}
              autoFocus
              placeholder="Molten"
              invalid={!!errors.name}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  name: event.target.value,
                  slug: collection ? current.slug : slugify(event.target.value),
                }))
              }
            />
          </Field>
          <Field label="URL" htmlFor="col-slug" error={errors.slug} hint={`/collections/${values.slug || '…'}`}>
            <Input id="col-slug" value={values.slug} invalid={!!errors.slug} onChange={(event) => setValues({ ...values, slug: slugify(event.target.value) })} />
          </Field>
          <Field label="Frase" htmlFor="col-desc" hint="Ej. “Classic jewelry to embody timeless elegance”." className="sm:col-span-2">
            <Textarea id="col-desc" rows={2} value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} />
          </Field>
          <Field label="Orden" htmlFor="col-order" hint="Menor = aparece antes.">
            <Input
              id="col-order"
              type="number"
              value={values.sort_order}
              onChange={(event) => setValues({ ...values, sort_order: Number(event.target.value) || 0 })}
            />
          </Field>
          <div className="self-center">
            <Toggle
              id="col-active"
              checked={values.is_active}
              onChange={(checked) => setValues({ ...values, is_active: checked })}
              label="Visible en la tienda"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 sm:col-span-2">
            {collection ? (
              <Button variant="danger" size="sm" onClick={remove} disabled={pending}>
                Eliminar colección
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              {(canCancel || collection) && (
                <Button variant="ghost" onClick={onClose}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" variant="primary" disabled={pending || uploading || !values.name.trim()}>
                {pending ? 'Guardando…' : collection ? 'Guardar' : 'Crear colección'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Card>
  )
}
