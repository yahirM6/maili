'use client'

import { createContext, useContext, useEffect, useRef, type ReactNode, type RefObject } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { gsap, ScrollTrigger } from '@/lib/gsap'

// Ref y no estado: Lenis nace en un efecto y los consumidores solo lo leen dentro de eventos
const LenisContext = createContext<RefObject<Lenis | null> | null>(null)

/** Ref a la instancia de Lenis; `current` es null con reduced-motion o antes de montar. */
export function useLenisRef() {
  const lenisRef = useContext(LenisContext)
  if (!lenisRef) throw new Error('useLenisRef debe usarse dentro de <SmoothScroll>')
  return lenisRef
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({ lerp: 0.1, anchors: true })
    lenisRef.current = lenis
    lenis.on('scroll', ScrollTrigger.update)

    // Lenis corre sobre el ticker de GSAP para que ambos compartan el mismo frame
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>
}
