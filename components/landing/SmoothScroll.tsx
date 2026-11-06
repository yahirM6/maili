'use client'

import { createContext, useContext, useEffect, useRef, type ReactNode, type RefObject } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { scrollToTarget } from '@/lib/scroll'

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

  // Enlaces internos: "#" es un marcador sin destino (no debe saltar arriba ni reactivar la hero);
  // "#seccion" se desplaza descontando la barra fija. Los anchors propios de Lenis no permiten ese offset
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = (event.target as Element | null)?.closest('a[href^="#"]')
      if (!link) return
      event.preventDefault()
      const hash = link.getAttribute('href') ?? '#'
      if (hash === '#') return
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (target) scrollToTarget(lenisRef.current, target)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({ lerp: 0.1 })
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
