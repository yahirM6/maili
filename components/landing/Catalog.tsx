'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useReveal } from '@/hooks/useReveal'

export type CatalogItem = {
  id: string
  name: string
  price: string
  /** Sin slug la celda no enlaza (piezas de ejemplo) */
  slug?: string
  imageUrl?: string | null
}

function RingPlaceholder({ seed }: { seed: number }) {
  const gap = (seed * 47) % 200

  return (
    <svg viewBox="0 0 200 200" fill="none" aria-hidden className="h-2/5 w-2/5 text-neutral-900">
      <circle cx="100" cy="100" r="74" stroke="currentColor" strokeWidth="9" strokeDasharray={`${380 - gap / 3} 80`} transform={`rotate(${seed * 67} 100 100)`} />
      <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.75" opacity="0.4" />
    </svg>
  )
}

function CellContent({ item, index }: { item: CatalogItem; index: number }) {
  return (
    <div data-reveal={(index % 3) * 0.1} className="flex h-full flex-col p-5 md:p-6">
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-contain transition-transform duration-1000 ease-out group-hover:scale-105"
          />
        ) : (
          <RingPlaceholder seed={index + 1} />
        )}
      </div>
      <h3 className="mt-5 text-sm tracking-tight">{item.name}</h3>
      <p className="mt-1 text-xs text-neutral-500">{item.price}</p>
    </div>
  )
}

export default function Catalog({ items }: { items: CatalogItem[] }) {
  const sectionRef = useRef<HTMLElement>(null)
  useReveal(sectionRef)

  // Celdas vacías para que la retícula de 3 columnas siempre cierre la última fila
  const emptyCells = (3 - (items.length % 3)) % 3

  return (
    <section ref={sectionRef} id="catalog" className="bg-white">
      <div className="flex items-baseline justify-between px-5 pb-5 pt-28 md:px-8 md:pt-40">
        <h2 className="font-serif text-4xl font-light md:text-6xl">The Rings</h2>
        <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
          {items.length} pieces
        </span>
      </div>

      {items.length === 0 ? (
        <p className="border-t border-neutral-200 px-5 py-20 text-center text-sm text-neutral-500">
          No pieces available right now.
        </p>
      ) : (
        <ul className="grid grid-cols-1 border-t border-neutral-200 md:grid-cols-3">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="group aspect-square border-b border-neutral-200 transition-colors duration-500 hover:bg-neutral-50 md:border-r md:nth-[3n]:border-r-0"
            >
              {item.slug ? (
                <Link href={`/products/${item.slug}`} className="block h-full">
                  <CellContent item={item} index={index} />
                </Link>
              ) : (
                <CellContent item={item} index={index} />
              )}
            </li>
          ))}

          {Array.from({ length: emptyCells }, (_, index) => (
            <li
              key={index}
              aria-hidden
              className="hidden aspect-square border-b border-neutral-200 md:block md:border-r md:nth-[3n]:border-r-0"
            />
          ))}
        </ul>
      )}
    </section>
  )
}
