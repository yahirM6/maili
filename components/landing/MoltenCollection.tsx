'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import ProductCard from '@/components/landing/ProductCard'
import SliderArrows from '@/components/landing/SliderArrows'
import { useReveal } from '@/hooks/useReveal'
import { MOLTEN, MOLTEN_FEATURE } from '@/lib/home-data'

const PER_PAGE = 4

export default function MoltenCollection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [page, setPage] = useState(0)
  useReveal(sectionRef)

  const pages = Math.ceil(MOLTEN.length / PER_PAGE)
  const visible = MOLTEN.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)

  return (
    <section ref={sectionRef} aria-label={`${MOLTEN_FEATURE.title} Collection`} data-snap className="grid bg-background md:h-svh md:grid-cols-2 md:grid-rows-1">
      <a
        href={MOLTEN_FEATURE.href}
        className="group relative block h-svh snap-start overflow-hidden bg-tile md:h-auto md:snap-align-none"
      >
        <Image
          src={MOLTEN_FEATURE.image}
          alt={MOLTEN_FEATURE.alt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
        />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/25 to-transparent" />
        <div
          data-reveal
          className="absolute inset-x-0 bottom-[5%] px-6 text-center font-garamond text-white [text-shadow:0_1px_12px_rgb(0_0_0/0.18)]"
        >
          <h2 className="text-[clamp(1.75rem,2.75vw,2.5rem)] leading-tight">
            {MOLTEN_FEATURE.title} <em>Collection</em>
          </h2>
          <p className="mt-1 text-[clamp(0.9375rem,1.3vw,1.1875rem)] leading-snug">{MOLTEN_FEATURE.subtitle}</p>
        </div>
      </a>

      <div className="flex min-h-svh snap-start flex-col justify-center px-5 pb-8 pt-20 md:min-h-0 md:snap-align-none md:px-[60px] md:pb-16 md:pt-[86px]">
        <div className="w-full md:mx-auto md:max-w-[clamp(30rem,32vw,44rem)]">
        <ul key={page} className="page-swap grid grid-cols-2 gap-x-3 gap-y-6 md:gap-x-5 md:gap-y-6">
          {visible.map((product, index) => (
            <li key={product.id} data-reveal={page === 0 ? (index % 2) * 0.08 : undefined}>
              <ProductCard product={product} sizes="(min-width: 768px) 21vw, 46vw" />
            </li>
          ))}
        </ul>

        <SliderArrows
          label="Molten pieces"
          canPrev={page > 0}
          canNext={page < pages - 1}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => Math.min(pages - 1, p + 1))}
          className="mt-6"
        />
        </div>
      </div>
    </section>
  )
}
