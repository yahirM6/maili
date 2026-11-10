'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useToast } from '@/components/admin/Toaster'
import { Badge, Button, Card, EmptyState, Field, Input, Textarea } from '@/components/admin/ui'
import { deleteCategory, deleteSubcategory, saveCategory, saveSubcategory } from '@/lib/admin/actions'
import type { ActionResult, CategoryWithSubs, Subcategory } from '@/lib/admin/types'
import { slugify } from '@/lib/admin/utils'

interface Props {
  categories: CategoryWithSubs[]
  usage: { categories: Record<string, number>; subcategories: Record<string, number> }
}

/** Ejecuta una action y muestra su resultado; devuelve si salió bien. */
function useRunner() {
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const run = (action: () => Promise<ActionResult<unknown>>, onDone?: (result: ActionResult<unknown>) => void) =>
    startTransition(async () => {
      const result = await action()
      if (result.ok) {
        if (result.message) toast(result.message)
      } else toast(result.message, 'error')
      onDone?.(result)
    })
  return { pending, run }
}

export default function CategoriesManager({ categories, usage }: Props) {
  const [creating, setCreating] = useState(categories.length === 0)

  return (
    <div className="grid gap-6">
      {creating ? (
        <CategoryForm onDone={() => setCreating(false)} onCancel={categories.length ? () => setCreating(false) : undefined} />
      ) : (
        <div>
          <Button variant="primary" onClick={() => setCreating(true)}>
            Nueva categoría
          </Button>
        </div>
      )}

      {categories.length === 0 && !creating && <EmptyState title="Aún no hay categorías" />}

      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} usage={usage} />
      ))}
    </div>
  )
}

function CategoryForm({ category, onDone, onCancel }: { category?: CategoryWithSubs; onDone: () => void; onCancel?: () => void }) {
  const { pending, run } = useRunner()
  const [name, setName] = useState(category?.name ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [sortOrder, setSortOrder] = useState(category?.sort_order ?? 0)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = (event: FormEvent) => {
    event.preventDefault()
    run(
      () => saveCategory({ id: category?.id, name, slug, description, sort_order: sortOrder }),
      (result) => (result.ok ? onDone() : setErrors(result.fieldErrors ?? {})),
    )
  }

  return (
    <Card title={category ? `Editar ${category.name}` : 'Nueva categoría'}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor={`name-${category?.id ?? 'new'}`} error={errors.name}>
          <Input
            id={`name-${category?.id ?? 'new'}`}
            value={name}
            autoFocus
            placeholder="Earrings"
            invalid={!!errors.name}
            onChange={(event) => {
              setName(event.target.value)
              if (!category) setSlug(slugify(event.target.value))
            }}
          />
        </Field>
        <Field label="URL" htmlFor={`slug-${category?.id ?? 'new'}`} error={errors.slug} hint={`/catalog/${slug || '…'}`}>
          <Input id={`slug-${category?.id ?? 'new'}`} value={slug} invalid={!!errors.slug} onChange={(event) => setSlug(slugify(event.target.value))} />
        </Field>
        <Field
          label="Descripción"
          htmlFor={`desc-${category?.id ?? 'new'}`}
          hint="Se muestra bajo el título de la página de la categoría."
          className="sm:col-span-2"
        >
          <Textarea id={`desc-${category?.id ?? 'new'}`} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        <Field label="Orden" htmlFor={`order-${category?.id ?? 'new'}`} hint="Menor = aparece antes en menús.">
          <Input id={`order-${category?.id ?? 'new'}`} type="number" value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value) || 0)} />
        </Field>
        <div className="flex items-end justify-end gap-2">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={pending || !name.trim()}>
            {pending ? 'Guardando…' : category ? 'Guardar' : 'Crear categoría'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function CategoryCard({ category, usage }: { category: CategoryWithSubs; usage: Props['usage'] }) {
  const { pending, run } = useRunner()
  const [editing, setEditing] = useState(false)
  const count = usage.categories[category.id] ?? 0

  if (editing) return <CategoryForm category={category} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />

  const remove = () => {
    if (count > 0) return
    if (!window.confirm(`¿Borrar la categoría "${category.name}" y sus subcategorías?`)) return
    run(() => deleteCategory(category.id))
  }

  return (
    <Card
      title={category.name}
      description={
        <>
          /catalog/{category.slug} · {count} {count === 1 ? 'producto' : 'productos'}
        </>
      }
      actions={
        <>
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={remove}
            disabled={pending || count > 0}
            title={count > 0 ? 'Mueve sus productos a otra categoría para poder borrarla' : undefined}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            Eliminar
          </Button>
        </>
      }
    >
      {category.description && <p className="mb-5 max-w-2xl text-sm text-neutral-600">{category.description}</p>}
      <Subcategories category={category} usage={usage.subcategories} />
    </Card>
  )
}

function Subcategories({ category, usage }: { category: CategoryWithSubs; usage: Record<string, number> }) {
  const { pending, run } = useRunner()
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<Subcategory | null>(null)

  const add = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    run(
      () => saveSubcategory({ category_id: category.id, name, slug: slugify(name), sort_order: category.subcategories.length }),
      (result) => result.ok && setName(''),
    )
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-neutral-700">Subcategorías</p>
      <ul className="flex flex-wrap gap-2">
        {category.subcategories.map((sub) =>
          editing?.id === sub.id ? (
            <li key={sub.id}>
              <form
                className="flex gap-1"
                onSubmit={(event) => {
                  event.preventDefault()
                  run(
                    () => saveSubcategory({ ...editing, slug: slugify(editing.name) }),
                    (result) => result.ok && setEditing(null),
                  )
                }}
              >
                <Input
                  aria-label="Nombre de la subcategoría"
                  value={editing.name}
                  autoFocus
                  className="h-8 w-40"
                  onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                />
                <Button type="submit" size="sm" variant="primary" disabled={pending}>
                  OK
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                  ✕
                </Button>
              </form>
            </li>
          ) : (
            <li key={sub.id} className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white py-1 pl-3 pr-1 text-sm">
              <button type="button" onClick={() => setEditing(sub)} className="hover:underline" title="Renombrar">
                {sub.name}
              </button>
              <Badge>{usage[sub.id] ?? 0}</Badge>
              <button
                type="button"
                aria-label={`Eliminar ${sub.name}`}
                className="grid size-6 place-items-center rounded-full text-neutral-400 hover:bg-red-50 hover:text-red-600"
                onClick={() => {
                  const used = usage[sub.id] ?? 0
                  const warning = used ? ` ${used} ${used === 1 ? 'producto se quedará' : 'productos se quedarán'} sin subcategoría.` : ''
                  if (window.confirm(`¿Eliminar "${sub.name}"?${warning}`)) run(() => deleteSubcategory(sub.id))
                }}
              >
                ✕
              </button>
            </li>
          ),
        )}
        <li>
          <form onSubmit={add} className="flex gap-1">
            <Input
              aria-label={`Nueva subcategoría de ${category.name}`}
              value={name}
              placeholder="Nueva (ej. Hoops)"
              className="h-8 w-44"
              onChange={(event) => setName(event.target.value)}
            />
            <Button type="submit" size="sm" disabled={pending || !name.trim()}>
              Agregar
            </Button>
          </form>
        </li>
      </ul>
    </div>
  )
}
