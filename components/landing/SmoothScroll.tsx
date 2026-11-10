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

/**
 * Scroll suave (Lenis) para las páginas de la tienda.
 * `sectionSnap`: en escritorio, cada gesto de rueda salta a la siguiente sección ([data-snap]). Solo tiene
 * sentido en la home, hecha de secciones a pantalla completa; en el resto el scroll es libre.
 */
export default function SmoothScroll({ children, sectionSnap = false }: { children: ReactNode; sectionSnap?: boolean }) {
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

    if (!sectionSnap) {
      return () => {
        gsap.ticker.remove(tick)
        gsap.ticker.lagSmoothing(500, 33)
        lenis.destroy()
        lenisRef.current = null
      }
    }

    // Escritorio: un gesto de rueda/touchpad salta a la siguiente sección (en móvil lo hace el scroll-snap CSS).
    // Puntos: el tope (hero), cada [data-snap] ("start end" = inicio y fin) y el final de la página.
    // Se miden una vez y se invalidan solo cuando cambia el tamaño de la página (imágenes, fuentes, resize).
    // Mientras dura el salto, y hasta que la inercia del touchpad se apaga, los eventos de rueda se
    // descartan: la cola del gesto no mueve la página ni dispara otro salto
    const desktop = window.matchMedia('(min-width: 768px)')
    let busy = false
    let waiting = false
    let lastWheel = 0
    let settleTimer: ReturnType<typeof setTimeout> | undefined
    let points: number[] | null = null

    const snapPoints = () => {
      if (points) return points
      const list = [0, lenis.limit]
      document.querySelectorAll<HTMLElement>('[data-snap]').forEach((element) => {
        const top = element.getBoundingClientRect().top + lenis.scroll
        const align = (element.dataset.snap ?? '').split(' ')
        if (!align.includes('end') || align.includes('start')) list.push(top)
        if (align.includes('end')) list.push(top + element.offsetHeight - window.innerHeight)
      })
      points = list.map(Math.round).sort((a, b) => a - b)
      return points
    }
    const invalidate = () => {
      points = null
    }
    const resizeObserver = new ResizeObserver(invalidate)
    resizeObserver.observe(document.body)

    // Tras el salto se descarta la cola de inercia del gesto anterior. La inercia del touchpad puede durar
    // 1-2 s, así que no se espera a que muera: un gesto nuevo se reconoce por el silencio de la rueda o
    // porque la magnitud sube (la cola de inercia solo decrece)
    let doneAt = 0
    let lastMagnitude = 0
    const settle = () => {
      if (performance.now() - lastWheel < 100) {
        settleTimer = setTimeout(settle, 40)
        return
      }
      waiting = false
    }

    const onWheel = (event: WheelEvent) => {
      if (!desktop.matches || event.ctrlKey) return
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return // swipe horizontal (carruseles)
      if ((event.target as Element | null)?.closest('[data-lenis-prevent]')) return

      const now = performance.now()
      const magnitude = Math.abs(event.deltaY)
      const rising = magnitude > lastMagnitude * 1.5 && magnitude >= 8
      lastWheel = now
      lastMagnitude = magnitude
      if (waiting && !busy && now - doneAt > 250 && rising) waiting = false
      if (busy || waiting) {
        event.preventDefault()
        event.stopImmediatePropagation()
        return
      }
      if (magnitude < 4) return

      const scroll = lenis.scroll
      const list = snapPoints()
      const next = event.deltaY > 0 ? list.find((point) => point > scroll + 2) : list.findLast((point) => point < scroll - 2)
      if (next === undefined) return // ya está en un extremo

      event.preventDefault()
      event.stopImmediatePropagation()
      busy = true
      lenis.scrollTo(next, {
        duration: 1.2,
        easing: (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)),
        lock: true,
        force: true,
        onComplete: () => {
          busy = false
          waiting = true
          doneAt = performance.now()
          settle()
        },
      })
    }
    // En captura y no pasiva: debe llegar antes que Lenis y poder cancelarle el evento
    window.addEventListener('wheel', onWheel, { capture: true, passive: false })

    return () => {
      window.removeEventListener('wheel', onWheel, { capture: true })
      resizeObserver.disconnect()
      clearTimeout(settleTimer)
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [sectionSnap])

  return <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>
}
