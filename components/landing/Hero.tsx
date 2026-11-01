//Hero.tsx
'use client'

import { useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { gsap, Observer, useGSAP } from '@/lib/gsap'
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
    image: '/images/hero/new-collection.png',
    alt: 'Model wearing pieces from the new Maili collection',
  },
  {
    id: 'earrings',
    label: 'Earrings',
    image: '/images/hero/earrings.png',
    alt: 'Close-up of Maili earrings',
  },
  {
    id: 'necklaces',
    label: 'Necklaces',
    image: '/images/hero/necklaces.png',
    alt: 'Maili necklace resting on the neckline',
  },
  {
    id: 'rings',
    label: 'Rings',
    image: '/images/hero/rings.png',
    alt: 'Hand wearing Maili rings',
  },
  {
    id: 'bracelets',
    label: 'Bracelets',
    image: '/images/hero/bracelets.png',
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
const TRANSITION = 1.1 // s que dura cada cambio de pantalla
const GESTURE_GAP = 150 // ms de silencio que separan un gesto del siguiente; la cola de inercia no cuenta como gesto nuevo
const GESTURE_MAX = 2500 // ms tras un cambio a partir de los cuales una entrada continua se acepta como gesto nuevo
const NUDGE = 100 // px que avanza la página al salir de la hero, para no "gastar" el gesto de salida

// El conteo del carrito vive en localStorage: el servidor siempre pinta 0 y el cliente corrige
const subscribeCart = (onChange: () => void) => useCartStore.subscribe(onChange)
const getCartCount = () => useCartStore.getState().items.reduce((total, item) => total + item.quantity, 0)
const getServerCartCount = () => 0

const pad = (n: number) => String(n).padStart(2, '0')

interface HeroControls {
  next: () => void
  toCatalog: () => void
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const controlsRef = useRef<HeroControls | null>(null)
  const lenisRef = useLenisRef()
  const [current, setCurrent] = useState(0)
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set())
  const bagCount = useSyncExternalStore(subscribeCart, getCartCount, getServerCartCount)

  const light = !!SCREENS[current].light

  useGSAP(
    () => {
      const section = sectionRef.current
      if (!section) return

      const screens = gsap.utils.toArray<HTMLElement>('[data-screen]', section)
      const medias = gsap.utils.toArray<HTMLElement>('[data-media]', section)
      const html = document.documentElement
      const mm = gsap.matchMedia()

      // `instant`: reduced-motion, mismos gestos pero el cambio de pantalla es directo
      const setup = (instant: boolean) => {
        // Timeline pausada: un label por pantalla; cada gesto la lleva de un label al siguiente por tiempo
        const timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
        timeline.addLabel('s0', 0)
        screens.forEach((screen, i) => {
          if (i === 0) return
          const at = i - 1
          // La cortina sube con el contenido; la foto se contra-mueve para ir más lenta que el borde
          timeline.fromTo(screen, { y: 0, yPercent: 100 }, { yPercent: 0, duration: 1 }, at)
          timeline.fromTo(medias[i], { yPercent: -15 }, { yPercent: 0, duration: 1 }, at)
          timeline.to(screens[i - 1], { yPercent: -15, duration: 1 }, at)
          timeline.addLabel(`s${i}`, i)
        })

        let index = 0
        let animating = false
        let lastEventAt = 0
        let lastStepAt = 0
        let freshGesture = true
        let heroActive = false
        let prevY = window.scrollY
        let frame = 0
        let tries = 0

        // Un gesto = una pantalla. Cada evento de entrada (también durante la transición y la inercia)
        // renueva lastEventAt: solo tras GESTURE_GAP de silencio el siguiente evento cuenta como gesto nuevo
        const onInput = () => {
          const now = performance.now()
          freshGesture = now - lastEventAt >= GESTURE_GAP || now - lastStepAt > GESTURE_MAX
          lastEventAt = now
        }

        const release = () => {
          animating = false
        }

        const show = (target: number) => {
          if (target === index) return
          index = target
          lastStepAt = performance.now()
          setCurrent(target)

          if (instant) {
            timeline.seek(`s${target}`)
            return
          }
          animating = true
          timeline.tweenTo(`s${target}`, {
            duration: TRANSITION,
            ease: 'power3.inOut',
            onComplete: release,
            onInterrupt: release,
          })
        }

        const enterHero = () => {
          if (heroActive) return
          heroActive = true
          // La inercia con la que se llegó arriba no debe contar como un gesto de la hero
          lastEventAt = performance.now()
          const lenis = lenisRef.current
          if (lenis) {
            lenis.scrollTo(0, { immediate: true, force: true })
            lenis.stop()
          } else {
            window.scrollTo(0, 0)
            html.style.overflow = 'hidden'
          }
          html.style.overscrollBehavior = 'none' // sin pull-to-refresh en móvil
          section.style.touchAction = 'none'
          observer.enable()
        }

        const exitHero = () => {
          if (!heroActive) return
          heroActive = false
          observer.disable()
          html.style.overscrollBehavior = ''
          html.style.overflow = ''
          section.style.touchAction = ''
          lenisRef.current?.start()
        }

        const step = (direction: 1 | -1, fresh: boolean) => {
          if (animating || !fresh) return
          if (direction === 1 && index === LAST) {
            // Gesto hacia abajo en la última pantalla: se suelta la página
            exitHero()
            const lenis = lenisRef.current
            if (lenis) lenis.scrollTo(NUDGE, { duration: 0.6 })
            else window.scrollBy({ top: NUDGE })
            return
          }
          show(Math.min(LAST, Math.max(0, index + direction)))
        }

        // Modo hero: la página no scrollea, los gestos cambian de pantalla
        const observer = Observer.create({
          type: 'wheel,touch',
          // -1 alinea rueda y touch: bajar la rueda y deslizar el dedo hacia arriba son ambos "onUp"
          wheelSpeed: -1,
          tolerance: 10,
          preventDefault: true,
          onChange: onInput,
          onUp: () => step(1, freshGesture),
          onDown: () => step(-1, freshGesture),
        })
        observer.disable()

        const toCatalog = () => {
          const catalog = document.getElementById('catalog')
          if (!catalog) return
          exitHero()
          const lenis = lenisRef.current
          if (lenis) lenis.scrollTo(catalog, { duration: 1.4 })
          else catalog.scrollIntoView()
        }

        controlsRef.current = {
          next: () => {
            if (animating) return
            if (index === LAST) toCatalog()
            else show(index + 1)
          },
          toCatalog,
        }

        const onKeyDown = (event: KeyboardEvent) => {
          if (!heroActive || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
          const target = event.target as HTMLElement
          if (target.closest('input, textarea, select, [contenteditable="true"]')) return
          // Espacio sobre un botón o enlace enfocado lo activa: no es navegación
          if (event.key === ' ' && target.closest('button, a')) return

          let direction: 1 | -1 | 0 = 0
          if (event.key === 'ArrowDown' || event.key === 'PageDown') direction = 1
          else if (event.key === 'ArrowUp' || event.key === 'PageUp') direction = -1
          else if (event.key === ' ') direction = event.shiftKey ? -1 : 1
          if (!direction) return

          event.preventDefault()
          step(direction, !event.repeat)
        }

        // Al volver a scrollY 0 hacia arriba se recupera el modo hero en la pantalla en que se quedó
        const onScroll = () => {
          const y = window.scrollY
          if (!heroActive && y <= 0 && prevY > 0) enterHero()
          prevY = y
        }

        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('scroll', onScroll, { passive: true })

        // Lenis nace en el efecto del padre, que corre después del de este componente
        const init = () => {
          if (!instant && !lenisRef.current && tries++ < 30) {
            frame = requestAnimationFrame(init)
            return
          }
          // Cada transición dura ~1 s: que ninguna foto llegue sin decodificar
          section.querySelectorAll('img').forEach((img) => img.decode?.().catch(() => {}))

          if (window.scrollY > 0) {
            // Recarga con la página ya scrolleada: la hero queda en su última pantalla
            index = LAST
            timeline.seek(`s${LAST}`)
          } else {
            enterHero()
          }
          setCurrent(index)
        }
        frame = requestAnimationFrame(init)

        return () => {
          cancelAnimationFrame(frame)
          window.removeEventListener('keydown', onKeyDown)
          window.removeEventListener('scroll', onScroll)
          observer.kill()
          if (heroActive) exitHero()
          controlsRef.current = null
        }
      }

      mm.add('(prefers-reduced-motion: no-preference)', () => setup(false))
      mm.add('(prefers-reduced-motion: reduce)', () => setup(true))
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
        onClick={() => controlsRef.current?.next()}
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
        onClick={(event) => {
          event.preventDefault()
          controlsRef.current?.toCatalog()
        }}
        className="absolute bottom-6 left-5 z-20 transition-opacity hover:opacity-60 md:bottom-8 md:left-8"
      >
        Catalog ↓
      </a>

      {/* En la pantalla de marca solo van las redes */}
      {!light && (
        <p className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap p-2 text-[10px] md:bottom-8">
          <span key={current} className="hero-swap block">
            {SCREENS[current].label}
          </span>
        </p>
      )}
    </section>
  )
}
