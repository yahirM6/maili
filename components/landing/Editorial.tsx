'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { gsap, useGSAP } from '@/lib/gsap'
import { EDITORIAL } from '@/lib/home-data'

export default function Editorial() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Parallax leve: la foto recorre un 10% de su alto mientras la sección cruza la pantalla
        gsap.fromTo(
          '[data-parallax]',
          { yPercent: -5 },
          {
            yPercent: 5,
            ease: 'none',
            scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        )
      })
    },
    { scope: sectionRef },
  )

  return (
    <section ref={sectionRef} aria-label="Editorial" className="relative aspect-[4/5] overflow-hidden bg-tile md:aspect-auto md:h-[min(90svh,56vw)]">
      <div data-parallax className="absolute inset-x-0 -top-[6%] h-[112%] will-change-transform">
        <Image src={EDITORIAL.image} alt={EDITORIAL.alt} fill sizes="100vw" className="object-cover object-[60%_50%]" />
      </div>
    </section>
  )
}
