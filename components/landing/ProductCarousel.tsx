'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ProductCard from '@/components/landing/ProductCard'
import SliderArrows from '@/components/landing/SliderArrows'
import { useReveal } from '@/hooks/useReveal'
import type { Product } from '@/lib/home-data'

interface ProductCarouselProps {
  id?: string
  title: string
  products: Product[]
}

export default function ProductCarousel({ id, title, products }: ProductCarouselProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })
  useReveal(sectionRef)

  const updateEdges = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const start = track.scrollLeft <= 2
    const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))
  }, [])

  useEffect(() => {
    updateEdges()
    window.addEventListener('resize', updateEdges)
    return () => window.removeEventListener('resize', updateEdges)
  }, [updateEdges])

  // Avanza exactamente una tarjeta (ancho + separación); el scroll-snap termina de alinear
  const move = (direction: 1 | -1) => {
    const track = trackRef.current
    const card = track?.firstElementChild as HTMLElement | null
    if (!track || !card) return
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0
    track.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: 'smooth' })
  }

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-label={title}
      className="bg-background px-5 pb-12 pt-12 md:px-[60px] md:pb-[clamp(3.5rem,4.5vw,6rem)] md:pt-[clamp(3.75rem,5vw,6rem)]"
    >
      <div className="mx-auto max-w-[1800px]">
      <h2 className="sr-only">{title}</h2>

      <ul
        ref={trackRef}
        onScroll={updateEdges}
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-2 overflow-x-auto px-5 md:mx-0 md:scroll-px-0 md:px-0"
      >
        {products.map((product, index) => (
          <li
            key={product.id}
            data-reveal={index < 4 ? index * 0.08 : undefined}
            className="shrink-0 basis-[68%] snap-start sm:basis-[calc((100%-16px)/2.4)] lg:basis-[calc((100%-24px)/4)] min-[1600px]:basis-[calc((100%-32px)/5)]"
          >
            <ProductCard product={product} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 42vw, 68vw" />
          </li>
        ))}
      </ul>

      <SliderArrows
        label="products"
        canPrev={!edges.start}
        canNext={!edges.end}
        onPrev={() => move(-1)}
        onNext={() => move(1)}
        className="mt-5 md:mt-6"
      />
      </div>
    </section>
  )
}
