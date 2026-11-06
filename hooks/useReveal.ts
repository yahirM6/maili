'use client'

import type { RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'

/**
 * Anima al entrar en pantalla todo lo marcado con `data-reveal` dentro de `scope`.
 * Se aplica al contenido y no a la celda para que las líneas del grid no se muevan.
 */
export function useReveal(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
          // Subida corta con frenado largo (expo): se siente más pausado que un fade-in común
          gsap.from(element, {
            y: 40,
            autoAlpha: 0,
            duration: 1.3,
            delay: Number(element.dataset.reveal) || 0,
            ease: 'expo.out',
            scrollTrigger: { trigger: element, start: 'top 88%', once: true },
          })
        })
      })

      ScrollTrigger.refresh()
    },
    { scope },
  )
}
