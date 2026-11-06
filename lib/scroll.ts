import type Lenis from 'lenis'

/** Alto de la barra fija, para que los saltos a una sección no queden tapados por ella. */
export const siteHeaderOffset = () => document.querySelector<HTMLElement>('[data-site-header]')?.offsetHeight ?? 0

/** Lleva la página a `target` (0 = arriba) con Lenis si existe, descontando la barra fija. */
export function scrollToTarget(lenis: Lenis | null, target: HTMLElement | 0, duration = 1.2) {
  const offset = target === 0 ? 0 : -siteHeaderOffset()
  if (lenis) {
    lenis.scrollTo(target, { duration, offset })
    return
  }
  const top = target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY + offset
  window.scrollTo({ top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}
