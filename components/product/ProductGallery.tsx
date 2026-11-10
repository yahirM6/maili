'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import type { StoreImage } from '@/lib/catalog'

interface Props {
  images: StoreImage[]
  title: string
}

/**
 * Escritorio: cuadrícula de 2 columnas con todas las fotos (se recorre bajando, con la info fija al lado).
 * Móvil: carrusel a todo el ancho que se desliza con el dedo, con contador y puntos.
 */
export default function ProductGallery({ images, title }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  if (images.length === 0) {
    return <div className="aspect-[4/5] bg-tile" aria-label={`${title}: sin fotos`} />
  }

  const onScroll = () => {
    const track = trackRef.current
    if (!track) return
    setActive(Math.round(track.scrollLeft / track.clientWidth))
  }

  const goTo = (index: number) => {
    const track = trackRef.current
    track?.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' })
  }

  return (
    <>
      {/* Móvil */}
      <div className="relative -mx-5 md:hidden">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          aria-roledescription="carousel"
          aria-label={`Photos of ${title}`}
        >
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative aspect-[4/5] w-full shrink-0 snap-center bg-tile"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${images.length}`}
            >
              <Photo image={image} title={title} priority={index === 0} sizes="100vw" />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                aria-label={`Show photo ${index + 1}`}
                aria-current={index === active}
                onClick={() => goTo(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === active ? 'w-5 bg-foreground' : 'w-1.5 bg-foreground/30'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Escritorio */}
      <ul className={`hidden gap-1 md:grid ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {images.map((image, index) => {
          // Con un número impar de fotos, la primera ocupa las dos columnas: así no queda un hueco al final
          const wide = images.length > 1 && images.length % 2 === 1 && index === 0
          return (
            <li key={image.id} className={`relative bg-tile ${wide ? 'col-span-2 aspect-[8/5]' : 'aspect-[4/5]'}`}>
              <Photo
                image={image}
                title={title}
                priority={index < 2}
                sizes={images.length === 1 || wide ? '(min-width: 1024px) 55vw, 100vw' : '(min-width: 1024px) 28vw, 50vw'}
              />
            </li>
          )
        })}
      </ul>
    </>
  )
}

function Photo({ image, title, priority, sizes }: { image: StoreImage; title: string; priority: boolean; sizes: string }) {
  return (
    // multiply funde el fondo blanco de la foto con el gris cálido del recuadro (igual que en las tarjetas)
    <div className="absolute inset-0 mix-blend-multiply">
      <Image
        src={image.url}
        alt={image.alt_text ?? title}
        fill
        sizes={sizes}
        // Las primeras fotos son lo primero que se ve: se piden de inmediato y con prioridad
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        className="object-contain p-[8%] brightness-[1.08]"
      />
    </div>
  )
}
