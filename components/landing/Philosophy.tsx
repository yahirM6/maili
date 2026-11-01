'use client'

import { useRef } from 'react'
import { useReveal } from '@/hooks/useReveal'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'

const MATERIALS = [
  { name: 'Gold', detail: 'Cast, filed and polished by hand until the surface holds no trace of the tool.' },
  { name: 'Silver', detail: 'Left soft and matte, so it records the life of the person who wears it.' },
  { name: 'Stone', detail: 'Chosen one at a time and set low, close to the skin, with nothing to catch.' },
]

function LoopVideo({ src, className }: { src: string; className: string }) {
  return (
    <div className={`overflow-hidden bg-neutral-900 ${className}`}>
      <video
        data-video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster="/images/water-poster.svg"
        className="h-full w-full object-cover"
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  )
}

export default function Philosophy() {
  const sectionRef = useRef<HTMLElement>(null)
  useReveal(sectionRef)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLVideoElement>('[data-video]').forEach((video) => {
          // Fuera de pantalla no hay motivo para seguir decodificando
          const visibility = ScrollTrigger.create({
            trigger: video.parentElement,
            onToggle: ({ isActive }) => {
              if (isActive) video.play().catch(() => {})
              else video.pause()
            },
          })

          // onToggle no corre al cargar: sin esto, autoPlay arrancaría los videos aún no visibles
          if (!visibility.isActive) video.pause()

          gsap.fromTo(
            video,
            { scale: 1.18 },
            {
              scale: 1,
              ease: 'none',
              scrollTrigger: { trigger: video.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          )
        })
      })

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.utils.toArray<HTMLVideoElement>('[data-video]').forEach((video) => video.pause())
      })
    },
    { scope: sectionRef },
  )

  return (
    <section ref={sectionRef} id="philosophy" className="bg-white">
      <div className="grid grid-cols-1 md:grid-cols-3">
        <div className="border-b border-neutral-200 px-5 pb-16 pt-28 md:col-span-2 md:border-r md:px-8 md:pb-24 md:pt-40">
          <h2 data-reveal className="font-serif text-6xl font-light leading-[0.95] tracking-[-0.02em] md:text-8xl">
            Made Without
            <br />
            <em>Compromise</em>
          </h2>
        </div>
        <div className="flex items-end border-b border-neutral-200 px-5 py-10 md:px-8 md:pb-24">
          <p data-reveal className="max-w-xs text-sm leading-relaxed text-neutral-600">
            Every piece begins as a measurement and ends as a feeling. We remove what is not
            needed, then remove a little more.
          </p>
        </div>

        <LoopVideo
          src="/videos/water-hands-01.mp4"
          className="aspect-video border-b border-neutral-200 md:col-span-3 md:aspect-[21/9]"
        />

        <div className="flex flex-col justify-between gap-16 border-b border-neutral-200 px-5 py-10 md:border-r md:px-8">
          <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Submerged</span>
          <p data-reveal className="font-serif text-3xl font-light leading-tight md:text-4xl">
            Water shows what polish hides. It is the last test each piece must pass.
          </p>
        </div>

        <LoopVideo
          src="/videos/water-hands-02.mp4"
          className="aspect-video border-b border-neutral-200 md:col-span-2 md:aspect-[16/10]"
        />

        {MATERIALS.map((material, index) => (
          <div
            key={material.name}
            className="border-b border-neutral-200 px-5 py-10 md:border-r md:px-8 md:nth-last-[1]:border-r-0"
          >
            <div data-reveal={index * 0.1}>
              <h3 className="font-serif text-3xl font-light">{material.name}</h3>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-600">{material.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
