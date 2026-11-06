'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { gsap, useGSAP } from '@/lib/gsap'
import { COLLECTIONS } from '@/lib/home-data'

export default function Collections() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Las fotos se destapan desde abajo en cascada, con un leve zoom que se asienta
        gsap
          .timeline({ scrollTrigger: { trigger: sectionRef.current, start: 'top 82%', once: true } })
          .fromTo(
            '[data-collection-media]',
            { clipPath: 'inset(100% 0% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, stagger: 0.12, ease: 'expo.inOut' },
            0,
          )
          .fromTo('[data-collection-media]', { scale: 1.15 }, { scale: 1, duration: 2, stagger: 0.12, ease: 'expo.out' }, 0.2)
          // Los nombres entran juntos (un solo disparo, no uno por elemento: los de la fila baja quedan bajo la línea de arranque)
          .fromTo('[data-collection-name]', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.3, ease: 'expo.out' }, 0.7)
      })
    },
    { scope: sectionRef },
  )

  return (
    <section ref={sectionRef} aria-label="Collections" data-snap className="h-svh snap-start bg-background pt-16 md:snap-align-none md:pt-[86px]">
      <ul className="grid h-full grid-cols-2 grid-rows-2 md:grid-cols-4 md:grid-rows-1">
        {COLLECTIONS.map((collection) => (
          <li key={collection.id} className="min-h-0">
            <a href={collection.href} className="group relative block h-full overflow-hidden">
              <div data-collection-media className="absolute inset-0 overflow-hidden bg-tile">
                <Image
                  src={collection.image}
                  alt={collection.alt}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                  style={{ objectPosition: collection.objectPosition ?? '50% 50%' }}
                />
                {/* Solo lo justo para que el texto blanco se lea sobre fondos claros */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-black/20 to-transparent"
                />
              </div>
              <p
                data-collection-name
                className="absolute inset-x-0 bottom-[5.5%] text-center font-garamond text-[clamp(1.0625rem,2.35vw,2.125rem)] md:text-[clamp(1.125rem,1.45vw,1.75rem)] leading-none text-white [text-shadow:0_1px_12px_rgb(0_0_0/0.18)]"
              >
                {collection.name} <em>Collection</em>
              </p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
