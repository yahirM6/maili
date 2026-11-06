'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { gsap, SplitText, useGSAP } from '@/lib/gsap'

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const section = sectionRef.current
      if (!section) return
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Entrada: la foto se destapa desde abajo y, encima, la barra y los textos suben línea por línea
        const intro = gsap.timeline({ defaults: { ease: 'expo.out' } })
        // La barra está fuera de la sección: se busca en el documento (los selectores de useGSAP se limitan a la hero)
        const headerItems = Array.from(document.querySelectorAll<HTMLElement>('[data-site-header] [data-intro]'))
        const media = section.querySelector<HTMLElement>('[data-hero-media]')
        const image = section.querySelector<HTMLElement>('[data-hero-image]')
        const button = section.querySelector<HTMLElement>('[data-hero-button]')

        intro
          .set(media, { visibility: 'visible' })
          .fromTo(
            media,
            { clipPath: 'inset(100% 0% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' },
            0,
          )
          .fromTo(image, { scale: 1.18 }, { scale: 1, duration: 2.2, ease: 'expo.out' }, 0.3)
          .fromTo(
            headerItems,
            { autoAlpha: 0, yPercent: -60 },
            { autoAlpha: 1, yPercent: 0, duration: 1.2, stagger: 0.06 },
            0.7,
          )

        // Cada línea sube desde una máscara. autoSplit vuelve a partir las líneas si cambia el ancho
        // o cargan las fuentes; al devolver la animación desde onSplit, SplitText la retoma donde iba
        const splits = gsap.utils.toArray<HTMLElement>('[data-hero-lines]', section).map((element, i) =>
          SplitText.create(element, {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            onSplit(self) {
              gsap.set(element, { visibility: 'visible' })
              return gsap.from(self.lines, {
                yPercent: 110,
                duration: 1.3,
                stagger: 0.12,
                ease: 'expo.out',
                delay: 0.95 + i * 0.25,
              })
            },
          }),
        )

        intro.fromTo(
          button,
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 1.1 },
          1.45,
        )

        // Al bajar, la primera sección sube encima de la hero (que es sticky) y la hero se oscurece un poco
        const cover = section.nextElementSibling
        if (cover) {
          gsap.fromTo(
            '[data-hero-dim]',
            { opacity: 0 },
            {
              opacity: 1,
              ease: 'none',
              scrollTrigger: { trigger: cover, start: 'top bottom', end: 'top top', scrub: true },
            },
          )
          gsap.to(media, {
            yPercent: -8,
            ease: 'none',
            scrollTrigger: { trigger: cover, start: 'top bottom', end: 'top top', scrub: true },
          })
        }

        return () => splits.forEach((split) => split.revert())
      })
    },
    { scope: sectionRef },
  )

  return (
    <section
      ref={sectionRef}
      className="sticky top-0 z-0 h-svh min-h-120 overflow-hidden bg-neutral-100"
    >
      <div data-hero-media data-intro className="absolute inset-0 will-change-transform">
        <div data-hero-image className="absolute inset-0">
          <Image
            src="/images/hero/hero-section.jpg"
            alt="Model wearing Maili jewelry"
            fill
            preload
            sizes="100vw"
            className="object-cover object-[70%_center]"
          />
        </div>
      </div>

      <div className="relative z-10 flex h-full max-w-[44rem] flex-col items-start justify-center px-5 pt-16 md:px-[60px] md:pt-[86px] lg:ml-[80px] lg:px-0">
        <h1
          data-hero-lines
          data-intro
          className="font-garamond text-[clamp(2.75rem,4.4vw,5rem)] font-medium leading-[1.05] tracking-[-0.01em] text-neutral-800"
        >
          Jewelry That
          <br />
          Speaks for You
        </h1>
        <p
          data-hero-lines
          data-intro
          className="mt-6 max-w-[30rem] font-garamond text-[clamp(1.0625rem,1.3vw,1.375rem)] leading-snug text-neutral-800"
        >
          Create bold accents with exquisite pieces that highlight your individuality.
        </p>
        <a
          href="#catalog"
          data-hero-button
          data-intro
          className="mt-10 bg-neutral-800 px-9 py-4 text-sm uppercase tracking-[0.02em] text-white transition-opacity hover:opacity-80"
        >
          Shop now
        </a>
      </div>

      {/* Se oscurece mientras la siguiente sección la cubre */}
      <div data-hero-dim aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 bg-black/35 opacity-0" />
    </section>
  )
}
