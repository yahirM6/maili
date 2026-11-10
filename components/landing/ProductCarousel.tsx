'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ProductCard from '@/components/landing/ProductCard'
import SliderArrows from '@/components/landing/SliderArrows'
import { gsap, SplitText, useGSAP } from '@/lib/gsap'
import type { Product } from '@/lib/home-data'

interface ProductCarouselProps {
  id?: string
  title: string
  products: Product[]
  /** section: pantalla completa con snap (home). inline: bloque normal dentro de otra página. */
  variant?: 'section' | 'inline'
}

export default function ProductCarousel({ id, title, products, variant = 'section' }: ProductCarouselProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  useGSAP(
    () => {
      const section = sectionRef.current
      if (!section) return
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const trigger = { trigger: section, start: 'top 75%', once: true }

        // Título: cada línea sube desde una máscara (mismo patrón que la hero)
        const title = section.querySelector<HTMLElement>('[data-carousel-title]')
        const split = title
          ? SplitText.create(title, {
              type: 'lines',
              mask: 'lines',
              autoSplit: true,
              onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.3, ease: 'expo.out', scrollTrigger: trigger }),
            })
          : null

        // Solo las primeras tarjetas (las visibles al llegar); el resto queda como está.
        // Un único ScrollTrigger por sección: uno por elemento no dispara si queda bajo la línea de arranque
        const cards = gsap.utils.toArray<HTMLElement>('[data-carousel-card]', section).slice(0, 5)
        const media = cards.map((card) => card.querySelector('[data-card-media]'))
        const zoom = cards.map((card) => card.querySelector('[data-card-zoom]'))
        const text = cards.flatMap((card) => Array.from(card.querySelectorAll('[data-card-text]')))

        // clearProps al terminar: no deja clip-path/transform pegados (capas de composición de más)
        gsap
          .timeline({ scrollTrigger: trigger })
          .fromTo(
            media,
            { clipPath: 'inset(100% 0% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, stagger: 0.1, ease: 'expo.inOut', clearProps: 'clipPath' },
            0,
          )
          .fromTo(zoom, { scale: 1.15 }, { scale: 1, duration: 2, stagger: 0.1, ease: 'expo.out', clearProps: 'transform' }, 0.2)
          .fromTo(
            text,
            { y: 24, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 1.1, stagger: 0.05, ease: 'expo.out', clearProps: 'transform,opacity,visibility' },
            0.7,
          )

        return () => split?.revert()
      })
    },
    { scope: sectionRef },
  )

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
      data-snap={variant === 'section' ? '' : undefined}
      className={
        variant === 'section'
          ? 'flex min-h-svh snap-start flex-col justify-center bg-background px-5 pb-12 pt-24 md:snap-align-none md:px-[60px] md:py-[86px]'
          : 'bg-background px-5 py-16 md:px-[60px] md:py-24'
      }
    >
      <div className="mx-auto w-full max-w-[1800px]">
      <h2 data-carousel-title className="mb-5 font-garamond text-[clamp(1.75rem,2.75vw,2.5rem)] leading-none md:mb-7">
        {title}
      </h2>

      <ul
        ref={trackRef}
        onScroll={updateEdges}
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-2 overflow-x-auto px-5 md:mx-0 md:scroll-px-0 md:px-0"
      >
        {products.map((product) => (
          <li
            key={product.id}
            data-carousel-card
            className="shrink-0 basis-[86%] snap-start sm:basis-[calc((100%-16px)/2.4)] lg:basis-[calc((100%-24px)/4)] min-[100rem]:basis-[calc((100%-32px)/5)]"
          >
            <ProductCard product={product} sizes="(min-width: 1600px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 42vw, 86vw" />
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
