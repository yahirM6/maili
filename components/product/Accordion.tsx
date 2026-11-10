'use client'

import { useId, useState, type ReactNode } from 'react'
import { MinusIcon, PlusIcon } from '@/components/landing/icons'

/** Sección plegable con línea arriba (Product details, Shipping and returns). */
export default function Accordion({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()

  return (
    <div className="border-t border-line">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between py-4 text-left text-[13px] uppercase tracking-[0.04em] transition-opacity hover:opacity-70"
        >
          {title}
          {open ? <MinusIcon className="size-4" /> : <PlusIcon className="size-4" />}
        </button>
      </h3>
      {/* grid-rows 0fr → 1fr: anima la altura sin medir el contenido */}
      <div
        id={id}
        role="region"
        className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden" inert={!open}>
          <div className="pb-5 font-garamond text-[16px] leading-relaxed text-foreground/85">{children}</div>
        </div>
      </div>
    </div>
  )
}
