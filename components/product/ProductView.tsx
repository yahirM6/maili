'use client'

import Image from 'next/image'
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { HeartIcon, MinusIcon, PlusIcon } from '@/components/landing/icons'
import Accordion from '@/components/product/Accordion'
import ProductGallery from '@/components/product/ProductGallery'
import type { StoreProduct } from '@/lib/catalog'
import { formatPrice } from '@/lib/home-data'
import { findVariant, initialSelection, materialInStock, materialsOf, sizeForMaterial, sizesOf } from '@/lib/product-options'
import { SHIPPING_AND_RETURNS } from '@/lib/store-content'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'

const LOW_STOCK = 3

// Favoritos viven en localStorage: el servidor no los conoce, así que se leen solo ya hidratado
const noopSubscribe = () => () => {}
const useHydrated = () => useSyncExternalStore(noopSubscribe, () => true, () => false)

/** Galería + compra. Comparten el metal elegido: al cambiarlo, la galería muestra sus fotos. */
export default function ProductView({ product }: { product: StoreProduct }) {
  const variants = product.product_variants
  const materials = useMemo(() => materialsOf(variants), [variants])

  const [selection, setSelection] = useState(() => initialSelection(variants))
  const [quantity, setQuantity] = useState(1)
  const [engraving, setEngraving] = useState('')
  const [added, setAdded] = useState<null | { id: number; quantity: number; label: string }>(null)

  const sizes = sizesOf(variants, selection.material)
  const variant = findVariant(variants, selection.material, selection.size)
  const stock = variant?.stock_quantity ?? 0
  const soldOut = !variant || stock === 0

  // Fotos del metal elegido + las generales; si el metal no tiene fotos propias, se ven todas
  const images = useMemo(() => {
    const own = product.product_images.filter((image) => !image.material || image.material === selection.material)
    return own.length ? own : product.product_images
  }, [product.product_images, selection.material])

  // Miniatura de cada metal: su primera foto propia (si no tiene, el botón muestra el nombre)
  const swatches = useMemo(
    () => new Map(materials.map((material) => [material, product.product_images.find((image) => image.material === material)?.url])),
    [materials, product.product_images],
  )

  const addItem = useCartStore((state) => state.addItem)
  const hydrated = useHydrated()
  const wished = useWishlistStore((state) => state.ids.includes(product.id)) && hydrated
  const toggleWish = useWishlistStore((state) => state.toggle)

  const chooseMaterial = (material: string) => {
    setSelection({ material, size: sizeForMaterial(variants, material, selection.size) })
    setQuantity(1)
  }

  const addToBag = () => {
    if (!variant || soldOut) return
    const qty = Math.min(quantity, stock)
    addItem({
      variant_id: variant.id,
      product_id: product.id,
      title: product.title,
      material: variant.material,
      size: variant.size,
      price: Number(variant.price),
      quantity: qty,
      max_stock: stock,
      engraving_text: engraving.trim() || undefined,
      image: images[0]?.url ?? product.product_images[0]?.url,
      slug: product.slug,
    })
    setAdded((previous) => ({ id: (previous?.id ?? 0) + 1, quantity: qty, label: [variant.material, variant.size].filter(Boolean).join(' · ') }))
  }

  const details = product.details?.split('\n').map((line) => line.trim()).filter(Boolean) ?? []
  const engravingId = useId()

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-10 xl:gap-16">
      <div className="min-w-0">
        <ProductGallery key={selection.material} images={images} title={product.title} />
      </div>

      {/* La info queda fija mientras se recorren las fotos */}
      <div className="min-w-0 self-start md:sticky md:top-[110px]">
        <h1 className="font-garamond text-[clamp(1.75rem,2.4vw,2.25rem)] font-medium leading-tight">{product.title}</h1>
        {product.description && (
          <p className="mt-4 whitespace-pre-line font-garamond text-[17px] leading-relaxed text-foreground/85">{product.description}</p>
        )}

        {materials.length > 0 && (
          <fieldset className="mt-7">
            <legend className="text-[13px]">
              Metal: <span className="text-foreground/70">{selection.material}</span>
            </legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {materials.map((material) => {
                const selected = material === selection.material
                const thumb = swatches.get(material)
                const available = materialInStock(variants, material)
                return (
                  <button
                    key={material}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${material}${available ? '' : ' (sold out)'}`}
                    title={material}
                    onClick={() => chooseMaterial(material)}
                    className={`relative grid place-items-center border bg-tile transition-colors ${
                      thumb ? 'size-16' : 'h-10 px-4 text-[13px]'
                    } ${selected ? 'border-foreground' : 'border-transparent hover:border-foreground/40'} ${available ? '' : 'opacity-50'}`}
                  >
                    {thumb ? (
                      <span className="absolute inset-1 mix-blend-multiply">
                        <Image src={thumb} alt="" fill sizes="64px" className="object-contain brightness-[1.08]" />
                      </span>
                    ) : (
                      material
                    )}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}

        {sizes.length > 0 && (
          <fieldset className="mt-6">
            <legend className="text-[13px]">
              Size: <span className="text-foreground/70">{selection.size}</span>
            </legend>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {sizes.map(({ size, inStock }) => {
                const selected = size === selection.size
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={!inStock}
                    aria-pressed={selected}
                    aria-label={inStock ? `Size ${size}` : `Size ${size}, sold out`}
                    onClick={() => {
                      setSelection({ ...selection, size })
                      setQuantity(1)
                    }}
                    className={`relative h-9 min-w-11 border px-3 text-[13px] transition-colors ${
                      selected ? 'border-foreground' : 'border-line hover:border-foreground/50'
                    } ${inStock ? '' : 'cursor-not-allowed text-foreground/35'}`}
                  >
                    {size}
                    {/* Agotada: diagonal como en la referencia */}
                    {!inStock && (
                      <span aria-hidden="true" className="absolute inset-0 overflow-hidden">
                        <span className="absolute left-1/2 top-1/2 h-px w-[140%] -translate-x-1/2 -translate-y-1/2 -rotate-[28deg] bg-foreground/25" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}

        {product.allow_engraving && (
          <div className="mt-6">
            <label htmlFor={engravingId} className="text-[13px]">
              Engraving <span className="text-foreground/60">(optional)</span>
            </label>
            <div className="relative mt-2.5">
              <input
                id={engravingId}
                value={engraving}
                maxLength={product.max_engraving_chars ?? undefined}
                onChange={(event) => setEngraving(event.target.value)}
                placeholder="e.g. A & M · 2026"
                className="h-10 w-full border border-line bg-transparent px-3 pr-14 font-garamond text-[16px] focus:border-foreground focus:outline-none"
              />
              {product.max_engraving_chars ? (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-foreground/50">
                  {engraving.length}/{product.max_engraving_chars}
                </span>
              ) : null}
            </div>
          </div>
        )}

        <p className="mt-7 font-garamond text-[26px] leading-none">{variant ? formatPrice(Number(variant.price)) : '—'}</p>
        <p aria-live="polite" className="mt-2 min-h-5 text-xs text-foreground/70">
          {soldOut ? 'Sold out' : stock <= LOW_STOCK ? `Only ${stock} left` : ''}
        </p>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-11 items-center border border-line">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="grid h-full w-10 place-items-center disabled:text-foreground/30"
            >
              <MinusIcon className="size-4" />
            </button>
            <span aria-live="polite" aria-label={`Quantity ${quantity}`} className="w-6 text-center text-[13px] tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={soldOut || quantity >= stock}
              onClick={() => setQuantity((value) => Math.min(stock, value + 1))}
              className="grid h-full w-10 place-items-center disabled:text-foreground/30"
            >
              <PlusIcon className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={addToBag}
            disabled={soldOut}
            className="h-11 flex-1 rounded-full bg-accent text-[13px] uppercase tracking-[0.06em] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:bg-foreground/20"
          >
            {soldOut ? 'Sold out' : 'Add to cart'}
          </button>

          <button
            type="button"
            aria-pressed={wished}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={() => toggleWish(product.id)}
            className="grid size-11 shrink-0 place-items-center rounded-full border border-accent text-accent transition-colors hover:bg-accent/10"
          >
            <HeartIcon filled={wished} className="size-5" />
          </button>
        </div>

        <div className="mt-8 border-b border-line">
          {details.length > 0 && (
            <Accordion title="Product details" defaultOpen>
              <ul className="list-disc space-y-1 pl-5">
                {details.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Accordion>
          )}
          <Accordion title="Shipping and returns" defaultOpen={details.length === 0}>
            {SHIPPING_AND_RETURNS.map((paragraph) => (
              <p key={paragraph} className="mb-3 last:mb-0">
                {paragraph}
              </p>
            ))}
          </Accordion>
        </div>
      </div>

      {added && (
        <AddedToBag
          key={added.id}
          title={product.title}
          image={images[0]?.url}
          label={added.label}
          quantity={added.quantity}
          onClose={() => setAdded(null)}
        />
      )}
    </div>
  )
}

/** Aviso breve bajo la barra al agregar algo a la bolsa. */
function AddedToBag({ title, image, label, quantity, onClose }: {
  title: string
  image?: string
  label: string
  quantity: number
  onClose: () => void
}) {
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })
  useEffect(() => {
    const timer = setTimeout(() => closeRef.current(), 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      role="status"
      className="fixed inset-x-4 top-[76px] z-40 flex items-center gap-4 bg-background p-4 shadow-[0_12px_40px_rgb(0_0_0/0.12)] md:inset-x-auto md:right-[60px] md:top-[100px] md:w-[22rem]"
    >
      {image && (
        <div className="relative size-16 shrink-0 bg-tile">
          <div className="absolute inset-1 mix-blend-multiply">
            <Image src={image} alt="" fill sizes="64px" className="object-contain brightness-[1.08]" />
          </div>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-[0.06em] text-foreground/60">Added to your bag</p>
        <p className="truncate font-garamond text-[17px]">{title}</p>
        <p className="text-xs text-foreground/70">
          {label}
          {quantity > 1 ? ` · ${quantity} pcs` : ''}
        </p>
      </div>
      <button type="button" onClick={onClose} aria-label="Close" className="self-start p-1 text-foreground/50 hover:text-foreground">
        ✕
      </button>
    </div>
  )
}
