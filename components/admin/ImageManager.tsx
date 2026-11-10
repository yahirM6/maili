'use client'

import Image from 'next/image'
import { useRef, useState, useTransition, type DragEvent } from 'react'
import { useToast } from '@/components/admin/Toaster'
import { Button, Card, Select, cx } from '@/components/admin/ui'
import { deleteImage, registerImages, reorderImages, updateImage } from '@/lib/admin/actions'
import type { ProductImage } from '@/lib/admin/types'
import { ACCEPT_ATTR, checkImage, MAX_IMAGE_MB, uploadImage } from '@/lib/admin/upload'

interface Props {
  productId: string
  productTitle: string
  images: ProductImage[]
  materials: string[]
}

/** Galería del producto. A diferencia del resto del formulario, cada cambio aquí se guarda al instante. */
export default function ImageManager({ productId, productTitle, images: initial, materials }: Props) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState(initial)
  const [uploading, setUploading] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [, startTransition] = useTransition()

  const upload = async (files: File[]) => {
    const problems = files.map(checkImage).filter(Boolean) as string[]
    problems.forEach((problem) => toast(problem, 'error'))
    const valid = files.filter((file) => !checkImage(file))
    if (!valid.length) return

    setUploading(valid.length)
    try {
      const urls: string[] = []
      for (const file of valid) {
        urls.push(await uploadImage(file, productId))
        setUploading((count) => count - 1)
      }
      const result = await registerImages(productId, urls, productTitle)
      toast(result.ok ? result.message ?? 'Fotos agregadas.' : result.message, result.ok ? 'success' : 'error')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'No se pudo subir la foto.', 'error')
    } finally {
      setUploading(0)
    }
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= images.length) return
    const next = [...images]
    ;[next[index], next[target]] = [next[target], next[index]]
    setImages(next) // optimista: se ve al instante y se corrige si falla
    startTransition(async () => {
      const result = await reorderImages(
        productId,
        next.map((image) => image.id),
      )
      if (!result.ok) {
        setImages(images)
        toast(result.message, 'error')
      }
    })
  }

  const setMaterial = (id: string, material: string) => {
    setImages((current) => current.map((image) => (image.id === id ? { ...image, material: material || null } : image)))
    startTransition(async () => {
      const alt = material ? `${productTitle} — ${material}` : productTitle
      const result = await updateImage(id, { material, alt_text: alt })
      if (!result.ok) toast(result.message, 'error')
    })
  }

  const remove = (image: ProductImage) => {
    if (!window.confirm('¿Eliminar esta foto? No se puede deshacer.')) return
    setImages((current) => current.filter((item) => item.id !== image.id))
    startTransition(async () => {
      const result = await deleteImage(image.id)
      if (!result.ok) {
        setImages(images)
        toast(result.message, 'error')
      } else toast(result.message ?? 'Foto eliminada.')
    })
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    upload(Array.from(event.dataTransfer.files))
  }

  return (
    <Card
      title="Fotos"
      description="La primera es la principal. Los cambios en fotos se guardan al instante."
      actions={
        <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading > 0}>
          Subir fotos
        </Button>
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        hidden
        onChange={(event) => {
          upload(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cx('rounded-md transition-colors', dragging && 'bg-neutral-100 ring-2 ring-neutral-900/20')}
      >
        {images.length === 0 && uploading === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center rounded-md border-2 border-dashed border-neutral-300 px-6 py-12 text-center hover:border-neutral-400"
          >
            <span className="text-sm font-medium text-neutral-900">Arrastra las fotos aquí o haz clic para elegirlas</span>
            <span className="mt-1 text-xs text-neutral-500">
              JPG, PNG, WebP o AVIF · hasta {MAX_IMAGE_MB} MB · ideal cuadradas o 3:4, de 1600 px o más
            </span>
          </button>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {images.map((image, index) => (
              <li key={image.id} className="overflow-hidden rounded-md border border-neutral-200 bg-white">
                <div className="relative aspect-[3/4] bg-neutral-100">
                  <Image src={image.url} alt={image.alt_text ?? ''} fill sizes="200px" className="object-cover" />
                  {index === 0 && (
                    <span className="absolute left-2 top-2 rounded bg-neutral-900/85 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                      Principal
                    </span>
                  )}
                </div>
                <div className="grid gap-2 p-2">
                  <Select
                    aria-label="Metal de esta foto"
                    value={image.material ?? ''}
                    onChange={(event) => setMaterial(image.id, event.target.value)}
                    className="h-8 text-xs"
                  >
                    <option value="">Todos</option>
                    {materials.map((material) => (
                      <option key={material} value={material}>
                        {material}
                      </option>
                    ))}
                  </Select>
                  <div className="flex items-center justify-between">
                    <div className="flex">
                      <Button size="sm" variant="ghost" className="px-2" aria-label="Mover antes" disabled={index === 0} onClick={() => move(index, -1)}>
                        ←
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="px-2"
                        aria-label="Mover después"
                        disabled={index === images.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        →
                      </Button>
                    </div>
                    <Button size="sm" variant="ghost" className="px-2 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => remove(image)}>
                      Eliminar
                    </Button>
                  </div>
                </div>
              </li>
            ))}
            {Array.from({ length: uploading }, (_, index) => (
              <li key={`uploading-${index}`} className="flex aspect-[3/4] items-center justify-center rounded-md border border-dashed border-neutral-300 bg-neutral-50">
                <span className="animate-pulse text-xs text-neutral-500">Subiendo…</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {materials.length > 1 && images.length > 0 && (
        <p className="mt-4 text-xs text-neutral-500">
          Asigna un metal a las fotos que solo muestran esa versión: en la tienda, al elegir el metal se verán esas fotos.
        </p>
      )}
    </Card>
  )
}
