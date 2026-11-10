'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { Button, Card, Field, Input, Select } from '@/components/admin/ui'
import { useToast } from '@/components/admin/Toaster'
import { createProduct } from '@/lib/admin/actions'
import type { Category } from '@/lib/admin/types'
import { slugify } from '@/lib/admin/utils'

export default function NewProductForm({ categories }: { categories: Category[] }) {
  const toast = useToast()
  const [pending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = (event: FormEvent) => {
    event.preventDefault()
    startTransition(async () => {
      // Si sale bien, la action redirige a la edición del producto
      const result = await createProduct({ title, slug, category_id: categoryId })
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        toast(result.message, 'error')
      }
    })
  }

  return (
    <form onSubmit={submit}>
      <Card>
        <div className="grid gap-5">
          <Field label="Nombre" htmlFor="title" error={errors.title}>
            <Input
              id="title"
              value={title}
              autoFocus
              required
              invalid={!!errors.title}
              placeholder="Ej. Anillo Aurora"
              onChange={(event) => {
                setTitle(event.target.value)
                if (!slugEdited) setSlug(slugify(event.target.value))
              }}
            />
          </Field>

          <Field label="URL" htmlFor="slug" error={errors.slug} hint={<>/products/<b>{slug || "…"}</b></>}>
            <Input
              id="slug"
              value={slug}
              invalid={!!errors.slug}
              onChange={(event) => {
                setSlugEdited(true)
                setSlug(slugify(event.target.value))
              }}
            />
          </Field>

          <Field label="Categoría" htmlFor="category" hint="Puedes cambiarla después.">
            <Select id="category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="">Sin categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button type="submit" variant="primary" disabled={pending || !title.trim()}>
          {pending ? 'Creando…' : 'Crear y continuar'}
        </Button>
      </div>
    </form>
  )
}
