//Hero.tsx
'use client'

import { useCallback, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { motion, useTransform } from 'framer-motion'
import { useMouseParallax } from '@/hooks/useMouseParallax'
import { gsap, useGSAP } from '@/lib/gsap'

// Three.js depende de window: la escena solo puede cargarse en el navegador
const ModelScene = dynamic(() => import('@/components/webgl/ModelScene'), { ssr: false })

// Se ve mientras carga WebGL y se queda si falla; debe coincidir en encuadre con la textura
const HERO_IMAGE = '/images/hero-model.jpg'

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const [sceneReady, setSceneReady] = useState(false)
  const { smoothX, smoothY } = useMouseParallax()
  const handleSceneReady = useCallback(() => setSceneReady(true), [])

  // El titular se mueve en sentido contrario a la imagen: ahí nace la profundidad
  const titleX = useTransform(smoothX, [-1, 1], [14, -14])
  const titleY = useTransform(smoothY, [-1, 1], [8, -8])

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const scrollTrigger = {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        }

        gsap.to('[data-hero-image]', { yPercent: 14, scale: 0.92, ease: 'none', scrollTrigger })
        gsap.to('[data-hero-title]', { yPercent: -40, ease: 'none', scrollTrigger })
      })
    },
    { scope: sectionRef },
  )

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex h-svh min-h-140 items-center justify-center overflow-hidden bg-white"
    >
      <div className="absolute inset-x-0 top-0 z-30 flex items-start justify-between p-5 text-[11px] uppercase tracking-[0.2em] md:p-8">
        <span>Maili</span>
        <a href="#catalog" className="transition-opacity hover:opacity-50">
          Catalog
        </a>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between p-5 text-[11px] uppercase tracking-[0.2em] md:p-8">
        <span>Fine jewellery</span>
        <a href="#philosophy" className="transition-opacity hover:opacity-50">
          Philosophy
        </a>
      </div>

      <div data-hero-image className="relative z-10 aspect-4/5 h-[76svh] max-w-[86vw]">
        <Image
          src={HERO_IMAGE}
          alt="Model wearing a Maili piece"
          fill
          priority
          sizes="(min-width: 768px) 60vh, 86vw"
          className={`object-contain object-bottom ${sceneReady ? 'opacity-0' : ''}`}
        />
        <ModelScene onReady={handleSceneReady} />
      </div>

      {/* mix-blend va en el nodo exterior: cualquier transform más arriba aislaría la mezcla */}
      <motion.h1
        className="hero-title-fade pointer-events-none absolute inset-x-0 top-[66%] z-20 text-center md:top-[44%] font-serif text-[clamp(3.5rem,14.5vw,14rem)] font-light uppercase leading-[0.92] tracking-[-0.02em] text-white mix-blend-difference"
        style={{ x: titleX, y: titleY }}
      >
        <span data-hero-title className="block">
          Measured
          <br />
          Purity
        </span>
      </motion.h1>
    </section>
  )
}
