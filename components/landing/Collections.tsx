'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { useReveal } from '@/hooks/useReveal'
import { gsap, useGSAP } from '@/lib/gsap'
import { COLLECTIONS } from '@/lib/home-data'

export default function Collections() {
  const sectionRef = useRef<HTMLElement>(null)
  useReveal(sectionRef)

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
      })
    },
    { scope: sectionRef },
  )

  return (
    <section ref={sectionRef} aria-label="Collections">
      <ul className="grid grid-cols-2 md:grid-cols-4">
        {COLLECTIONS.map((collection, index) => (
          <li key={collection.id}>
            <a href={collection.href} className="group relative block aspect-[720/870] overflow-hidden">
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
                data-reveal={0.7 + index * 0.12}
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
