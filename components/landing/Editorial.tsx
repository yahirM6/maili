'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { gsap, useGSAP } from '@/lib/gsap'
import { EDITORIAL } from '@/lib/home-data'

/**
 * Foto que crece con el scroll: la sección es más alta que la pantalla y su interior queda fijo (sticky);
 * mientras se recorre, la foto pasa de tarjeta centrada a pantalla completa y un texto gigante cruza detrás.
 */
export default function Editorial() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(
        {
          desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          mobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
        },
        (context) => {
          const { desktop } = context.conditions as { desktop: boolean }
          // Recorte inicial: tarjeta vertical al centro (más ancha en móvil para que se lea la foto)
          const start = desktop ? 'inset(16% 33% 16% 33%)' : 'inset(18% 10% 18% 10%)'

          const timeline = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom bottom', scrub: true },
          })

          timeline
            .fromTo('[data-frame]', { clipPath: start }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power2.inOut' }, 0)
            .fromTo('[data-zoom]', { scale: 1.3 }, { scale: 1, duration: 1, ease: 'power2.inOut' }, 0)
            // Pausa al final: la foto se queda a pantalla completa un momento antes de soltar la sección
            .to({}, { duration: 0.25 })

          // El texto cruza desde que la sección asoma hasta que se va
          gsap.fromTo(
            '[data-marquee]',
            { xPercent: 0 },
            {
              xPercent: -45,
              ease: 'none',
              scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          )
        },
      )
    },
    { scope: sectionRef },
  )

  return (
    <section ref={sectionRef} aria-label="Editorial" className="relative bg-background motion-safe:h-[240svh]">
      <div className="sticky top-16 h-[calc(100svh-4rem)] overflow-hidden md:top-[86px] md:h-[calc(100svh-86px)]">
        <p
          data-marquee
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-1/2 hidden -translate-y-1/2 whitespace-nowrap font-serif text-[19vw] font-light uppercase leading-none tracking-[0.02em] text-foreground/[0.07] motion-safe:block"
        >
          {EDITORIAL.marquee} {EDITORIAL.marquee}
        </p>

        <div className="absolute inset-x-0 bottom-[5%] hidden flex-col items-center gap-2 text-center motion-safe:flex">
          <p className="font-garamond text-[clamp(1.125rem,1.4vw,1.5rem)] uppercase tracking-[0.12em]">{EDITORIAL.caption}</p>
          <a href={EDITORIAL.cta.href} className="text-xs uppercase tracking-[0.12em] underline underline-offset-4 hover:opacity-60">
            {EDITORIAL.cta.label}
          </a>
        </div>

        <div data-frame className="absolute inset-0 overflow-hidden bg-tile will-change-[clip-path]">
          <div data-zoom className="absolute inset-0 will-change-transform">
            <Image src={EDITORIAL.image} alt={EDITORIAL.alt} fill sizes="100vw" className="object-cover object-[60%_50%]" />
          </div>
        </div>
      </div>
    </section>
  )
}
