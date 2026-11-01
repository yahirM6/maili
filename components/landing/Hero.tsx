//Hero.tsx
'use client'

import { useCallback, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { useLenisRef } from '@/components/landing/SmoothScroll'
import { useCartStore } from '@/store/cartStore'

interface Screen {
  id: string
  label: string
  /** Sin imagen = pantalla de cierre de marca (fondo liso) */
  image?: string
  alt?: string
  /** Encuadre de la foto; ajústalo por pantalla para móvil */
  objectPosition?: string
  /** Texto oscuro sobre fondo claro */
  light?: boolean
}

const SCREENS: Screen[] = [
  {
    id: 'new-collection',
    label: 'New Collection',
    image: '/images/hero/new-collection.jpg',
    alt: 'Model wearing pieces from the new Maili collection',
  },
  {
    id: 'earrings',
    label: 'Earrings',
    image: '/images/hero/earrings.jpg',
    alt: 'Close-up of Maili earrings',
  },
  {
    id: 'necklaces',
    label: 'Necklaces',
    image: '/images/hero/necklaces.jpg',
    alt: 'Maili necklace resting on the neckline',
  },
  {
    id: 'rings',
    label: 'Rings',
    image: '/images/hero/rings.jpg',
    alt: 'Hand wearing Maili rings',
  },
  {
    id: 'bracelets',
    label: 'Bracelets',
    image: '/images/hero/bracelets.jpg',
    alt: 'Wrist wearing Maili bracelets',
  },
  { id: 'brand', label: 'Follow', light: true },
]

const SOCIALS = [
  { label: 'Instagram', href: '#' },
  { label: 'Facebook', href: '#' },
  { label: 'TikTok', href: '#' },
  { label: 'Pinterest', href: '#' },
]

const LAST = SCREENS.length - 1
const SNAP_DELAY = 120 // ms sin scroll antes de acomodar la pantalla
const SNAP_THRESHOLD = 0.15 // fracción del tramo que basta para avanzar a la vecina

// El conteo del carrito vive en localStorage: el servidor siempre pinta 0 y el cliente corrige
const subscribeCart = (onChange: () => void) => useCartStore.subscribe(onChange)
const getCartCount = () => useCartStore.getState().items.reduce((total, item) => total + item.quantity, 0)
const getServerCartCount = () => 0

const pad = (n: number) => String(n).padStart(2, '0')

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<ScrollTrigger | null>(null)
  const stepsRef = useRef(LAST) // tramos en los que se divide el recorrido pinned
  const currentRef = useRef(0)
  const lenisRef = useLenisRef()
  const [current, setCurrent] = useState(0)
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set())
  const bagCount = useSyncExternalStore(subscribeCart, getCartCount, getServerCartCount)

  const light = !!SCREENS[current].light

  const updateCurrent = useCallback((index: number) => {
    if (index === currentRef.current) return
    currentRef.current = index
    setCurrent(index)
  }, [])

  const scrollToY = useCallback(
    (y: number, duration: number) => {
      const lenis = lenisRef.current
      if (lenis) lenis.scrollTo(y, { duration })
      else window.scrollTo({ top: y })
    },
    [lenisRef],
  )

  const goTo = useCallback(
    (index: number) => {
      const trigger = triggerRef.current
      if (!trigger) return
      scrollToY(trigger.start + (index / stepsRef.current) * (trigger.end - trigger.start), 1.2)
    },
    [scrollToY],
  )

  const goToCatalog = useCallback(() => {
    const catalog = document.getElementById('catalog')
    if (!catalog) return
    const lenis = lenisRef.current
    if (lenis) lenis.scrollTo(catalog, { duration: 1.4 })
    else catalog.scrollIntoView()
  }, [lenisRef])

  const handleCounter = () => (current === LAST ? goToCatalog() : goTo(current + 1))

  useGSAP(
    () => {
      const section = sectionRef.current
      if (!section) return

      const screens = gsap.utils.toArray<HTMLElement>('[data-screen]', section)
      const medias = gsap.utils.toArray<HTMLElement>('[data-media]', section)
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        stepsRef.current = LAST

        const timeline = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: `+=${LAST * 100}%`,
            pin: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => updateCurrent(Math.round(self.progress * LAST)),
          },
        })
        triggerRef.current = timeline.scrollTrigger ?? null

        screens.forEach((screen, i) => {
          if (i === 0) return
          const at = i - 1
          // La cortina sube con el contenido; la foto se contra-mueve para ir más lenta que el borde
          timeline.fromTo(screen, { y: 0, yPercent: 100 }, { yPercent: 0, duration: 1 }, at)
          timeline.fromTo(medias[i], { yPercent: -15 }, { yPercent: 0, duration: 1 }, at)
          timeline.to(screens[i - 1], { yPercent: -15, duration: 1 }, at)
        })

        // Snap propio con dirección: el de ScrollTrigger pelea con la interpolación de Lenis.
        // Un gesto que cruza SNAP_THRESHOLD del tramo avanza a la pantalla vecina en vez de rebotar
        let timer: number | undefined
        let touching = false
        let from: number | null = null // pantalla en reposo al empezar el gesto

        const position = (y: number, trigger: ScrollTrigger) =>
          ((y - trigger.start) / (trigger.end - trigger.start)) * LAST
        const clampIndex = (n: number) => Math.min(LAST, Math.max(0, n))

        const settle = () => {
          const trigger = triggerRef.current
          const lenis = lenisRef.current
          if (!trigger || touching) return
          if (lenis?.isScrolling) return schedule()

          const y = window.scrollY
          const start = from
          from = null
          if (y < trigger.start || y > trigger.end) return

          const f = position(y, trigger)
          const base = start ?? Math.round(f)
          const delta = f - base
          const index =
            Math.abs(delta) < 1
              ? base + (delta > SNAP_THRESHOLD ? 1 : delta < -SNAP_THRESHOLD ? -1 : 0)
              : Math.round(f)

          const target = trigger.start + (clampIndex(index) / LAST) * (trigger.end - trigger.start)
          if (Math.abs(target - y) > 1) scrollToY(target, 0.45)
        }
        const schedule = () => {
          window.clearTimeout(timer)
          timer = window.setTimeout(settle, SNAP_DELAY)
        }
        const onScroll = () => {
          const trigger = triggerRef.current
          if (from === null && trigger) from = clampIndex(Math.round(position(window.scrollY, trigger)))
          schedule()
        }
        const onTouchStart = () => {
          touching = true
          window.clearTimeout(timer)
        }
        const onTouchEnd = () => {
          touching = false
          schedule()
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('touchstart', onTouchStart, { passive: true })
        window.addEventListener('touchend', onTouchEnd, { passive: true })
        window.addEventListener('touchcancel', onTouchEnd, { passive: true })

        return () => {
          window.clearTimeout(timer)
          window.removeEventListener('scroll', onScroll)
          window.removeEventListener('touchstart', onTouchStart)
          window.removeEventListener('touchend', onTouchEnd)
          window.removeEventListener('touchcancel', onTouchEnd)
          triggerRef.current = null
        }
      })

      // Sin cortinas ni parallax: pantallas apiladas que cambian de golpe en cada tramo
      mm.add('(prefers-reduced-motion: reduce)', () => {
        stepsRef.current = SCREENS.length
        gsap.set(screens, { y: 0, yPercent: 0 })
        gsap.set(medias, { yPercent: 0 })

        const show = (index: number) =>
          screens.forEach((screen, i) => gsap.set(screen, { visibility: i <= index ? 'visible' : 'hidden' }))
        show(0)

        triggerRef.current = ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: `+=${SCREENS.length * 100}%`,
          pin: true,
          invalidateOnRefresh: true,
          snap: { snapTo: 1 / SCREENS.length, duration: { min: 0.1, max: 0.3 }, ease: 'power1.inOut' },
          onUpdate: (self) => {
            const index = Math.min(LAST, Math.floor(self.progress * SCREENS.length + 0.001))
            if (index === currentRef.current) return
            show(index)
            updateCurrent(index)
          },
        })

        return () => {
          triggerRef.current = null
        }
      })
    },
    { scope: sectionRef },
  )

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label="Maili collections"
      className={`relative isolate h-svh min-h-120 overflow-hidden bg-neutral-300 text-[11px] uppercase tracking-[0.2em] transition-colors duration-500 ${
        light ? 'text-neutral-900' : 'text-white'
      }`}
    >
      {SCREENS.map((screen, i) => (
        <div
          key={screen.id}
          data-screen
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${SCREENS.length}: ${screen.label}`}
          className={`absolute inset-0 overflow-hidden will-change-transform ${
            screen.image ? 'bg-linear-to-br from-neutral-300 to-neutral-500' : 'bg-[#ECEAE5]'
          }`}
          // Las pantallas posteriores parten fuera de cuadro, también antes de que cargue el JS
          style={{ zIndex: i + 1, transform: i > 0 ? 'translateY(100%)' : undefined }}
        >
          {screen.image ? (
            <div data-media className="absolute inset-x-0 top-0 h-[115%] will-change-transform">
              {!failed.has(screen.id) && (
                <Image
                  src={screen.image}
                  alt={screen.alt ?? screen.label}
                  fill
                  preload={i === 0}
                  loading="eager"
                  decoding="async"
                  fetchPriority={i === 0 ? 'high' : 'low'}
                  sizes="100vw"
                  className="object-cover"
                  style={{ objectPosition: screen.objectPosition ?? '50% 50%' }}
                  onError={() => setFailed((prev) => new Set(prev).add(screen.id))}
                />
              )}
            </div>
          ) : (
            <>
              <div data-media aria-hidden="true" className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="font-serif text-[clamp(6rem,24vw,22rem)] font-light normal-case leading-none tracking-[-0.02em] text-neutral-900">
                  Maili
                </p>
              </div>
              <ul className="absolute inset-x-0 bottom-24 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 text-neutral-900 md:bottom-28 md:gap-x-12">
                {SOCIALS.map((social) => (
                  <li key={social.label}>
                    <a href={social.href} className="transition-opacity hover:opacity-50">
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ))}

      {/* Degradados sutiles para asegurar legibilidad del texto blanco sobre las fotos */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-36 bg-linear-to-b from-black/30 to-transparent transition-opacity duration-500 ${
          light ? 'opacity-0' : ''
        }`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-44 bg-linear-to-t from-black/35 to-transparent transition-opacity duration-500 ${
          light ? 'opacity-0' : ''
        }`}
      />

      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-5 md:p-8">
        <div className="flex items-center gap-5">
          <button type="button" aria-label="Open menu" className="-m-2 flex flex-col gap-1.25 p-2">
            <span className="block h-px w-6 bg-current" />
            <span className="block h-px w-6 bg-current" />
          </button>
          <span
            aria-hidden={light}
            className={`font-serif text-2xl normal-case tracking-[0.02em] transition-opacity duration-500 ${
              light ? 'opacity-0' : ''
            }`}
          >
            Maili
          </span>
        </div>

        <nav aria-label="Account" className="flex items-center gap-5 md:gap-8">
          <button
            type="button"
            aria-label="Search"
            className="hidden border-b border-current pb-0.5 transition-opacity hover:opacity-60 md:block"
          >
            Search
          </button>
          <button type="button" aria-label="Log in" className="hidden transition-opacity hover:opacity-60 md:block">
            Log in
          </button>
          <button
            type="button"
            aria-label={`Bag, ${bagCount} ${bagCount === 1 ? 'item' : 'items'}`}
            className="transition-opacity hover:opacity-60"
          >
            Bag ({bagCount})
          </button>
        </nav>
      </header>

      <button
        type="button"
        onClick={handleCounter}
        aria-label={current === LAST ? 'Go to catalog' : `Next screen, ${current + 2} of ${SCREENS.length}`}
        className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-3 p-2 tabular-nums md:right-8"
      >
        <span key={current} aria-live="polite" className="hero-swap">
          {pad(current + 1)}
        </span>
        <span aria-hidden="true" className="block h-16 w-px bg-current md:h-24" />
        <span>{pad(SCREENS.length)}</span>
      </button>

      <a
        href="#catalog"
        className="absolute bottom-6 left-5 z-20 transition-opacity hover:opacity-60 md:bottom-8 md:left-8"
      >
        Catalog ↓
      </a>

      {/* En la pantalla de marca solo van las redes */}
      {!light && (
        <button
          type="button"
          onClick={() => goTo(current)}
          aria-label={`Show ${SCREENS[current].label}`}
          className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap p-2 text-[10px] md:bottom-8"
        >
          <span key={current} className="hero-swap block">
            {SCREENS[current].label}
          </span>
        </button>
      )}
    </section>
  )
}
