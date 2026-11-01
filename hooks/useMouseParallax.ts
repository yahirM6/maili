//useMouseParallax.ts
'use client'

import { useEffect } from 'react'
import {
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type SpringOptions,
} from 'framer-motion'

type MouseParallaxOptions = {
  /** Rotación máxima en grados cuando el cursor toca el borde del viewport */
  maxRotate?: number
  /** Traslación máxima en píxeles cuando el cursor toca el borde del viewport */
  maxTranslate?: number
  spring?: SpringOptions
}

const DEFAULT_SPRING: SpringOptions = { stiffness: 70, damping: 18, mass: 0.6 }

export function useMouseParallax({
  maxRotate = 9,
  maxTranslate = 26,
  spring = DEFAULT_SPRING,
}: MouseParallaxOptions = {}) {
  const shouldReduceMotion = useReducedMotion()

  // Posición del cursor normalizada: -1 (izquierda/arriba) a 1 (derecha/abajo)
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)

  const smoothX = useSpring(pointerX, spring)
  const smoothY = useSpring(pointerY, spring)

  // rotateX va invertido: el cursor arriba debe inclinar la cara superior hacia atrás
  const rotateY = useTransform(smoothX, [-1, 1], [-maxRotate, maxRotate])
  const rotateX = useTransform(smoothY, [-1, 1], [maxRotate, -maxRotate])
  const x = useTransform(smoothX, [-1, 1], [-maxTranslate, maxTranslate])
  const y = useTransform(smoothY, [-1, 1], [-maxTranslate, maxTranslate])

  useEffect(() => {
    // En táctil no hay cursor que seguir; la imagen se queda centrada
    const hasCursor = window.matchMedia('(pointer: fine)').matches
    if (shouldReduceMotion || !hasCursor) return

    const handleMouseMove = (event: MouseEvent) => {
      pointerX.set((event.clientX / window.innerWidth) * 2 - 1)
      pointerY.set((event.clientY / window.innerHeight) * 2 - 1)
    }

    const handleMouseLeave = () => {
      pointerX.set(0)
      pointerY.set(0)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [pointerX, pointerY, shouldReduceMotion])

  return { rotateX, rotateY, x, y, smoothX, smoothY }
}
