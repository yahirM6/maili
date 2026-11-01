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
          gsap.from(element, {
            y: 48,
            autoAlpha: 0,
            duration: 1.2,
            delay: Number(element.dataset.reveal) || 0,
            ease: 'power3.out',
            scrollTrigger: { trigger: element, start: 'top 90%', once: true },
          })
        })
      })

      ScrollTrigger.refresh()
    },
    { scope },
  )
}
