'use client'

import { useRef } from 'react'
import { FacebookIcon, InstagramIcon, PinterestIcon } from '@/components/landing/icons'
import { gsap, useGSAP } from '@/lib/gsap'
import { FOOTER_COLUMNS, SOCIAL_LINKS } from '@/lib/home-data'

const SOCIAL_ICONS = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  pinterest: PinterestIcon,
}

/**
 * En escritorio el footer espera fijo (sticky) detrás del contenido, que tiene z-10 y fondo propio:
 * al llegar al final, la página se desliza hacia arriba y lo destapa. En móvil es más alto que la
 * pantalla, así que fluye normal.
 */
export default function Footer() {
  const footerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const footer = footerRef.current
      if (!footer) return
      const mm = gsap.matchMedia()

      mm.add(
        {
          desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          mobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
        },
        (context) => {
          const { desktop } = context.conditions as { desktop: boolean }
          // Sticky: la posición del footer no sirve como disparador; se usa el final del contenido que lo tapa
          const content = footer.previousElementSibling
          const trigger = desktop && content ? { trigger: content, start: 'bottom 92%' } : { trigger: footer, start: 'top 88%' }

          const reveal = gsap.timeline({ scrollTrigger: { ...trigger, once: true } })
          reveal
            .fromTo('[data-footer-line]', { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'expo.inOut' }, 0)
            .fromTo(
              '[data-footer-item]',
              { autoAlpha: 0, y: 32 },
              { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out' },
              0.25,
            )

          if (desktop && content) {
            // Mientras se destapa, el contenido del footer sube un poco más lento: se siente debajo de la página
            gsap.fromTo(
              '[data-footer-inner]',
              { yPercent: -35 },
              {
                yPercent: 0,
                ease: 'none',
                scrollTrigger: { trigger: content, start: 'bottom bottom', end: () => `bottom ${window.innerHeight - footer.offsetHeight}px`, scrub: true },
              },
            )
          }
        },
      )
    },
    { scope: footerRef },
  )

  return (
    <footer
      ref={footerRef}
      className="z-0 snap-start overflow-hidden bg-background px-5 pb-16 pt-8 md:sticky md:bottom-0 md:px-[60px] md:pb-20 md:pt-[42px]"
    >
      <div data-footer-inner>
        <div data-footer-line aria-hidden="true" className="h-px origin-left bg-line" />
        <div className="grid grid-cols-2 gap-y-10 pt-10 md:grid-cols-[minmax(0,406fr)_199fr_199fr_199fr_minmax(0,317fr)] md:gap-y-0">
          <div data-footer-item className="col-span-2 flex items-start justify-between md:col-span-1 md:block">
            <div>
              <p className="font-serif text-[2.75rem] font-normal leading-none tracking-[-0.01em]">Maili</p>
              <p className="mt-6 text-sm">© {new Date().getFullYear()} Maili. All rights reserved.</p>
            </div>
            <SocialLinks className="md:hidden" />
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} data-footer-item>
              <h2 className="font-garamond text-[1.375rem] font-medium leading-none">{column.title}</h2>
              <ul className="mt-5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="inline-block py-[3.5px] text-sm transition-opacity hover:opacity-60">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div data-footer-item className="hidden md:block">
            <SocialLinks className="justify-end" />
          </div>
        </div>
      </div>
    </footer>
  )
}

function SocialLinks({ className = '' }: { className?: string }) {
  return (
    <ul className={`flex items-start gap-6 ${className}`}>
      {SOCIAL_LINKS.map((social) => {
        const Icon = SOCIAL_ICONS[social.id]
        return (
          <li key={social.id}>
            <a href={social.href} aria-label={social.label} className="block text-accent transition-opacity hover:opacity-70">
              <Icon className="size-7" />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
