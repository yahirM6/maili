'use client'

import { BagIcon, MenuIcon, SearchIcon, UserIcon } from '@/components/landing/icons'
import { useLenisRef } from '@/components/landing/SmoothScroll'
import { useBagCount } from '@/hooks/useBagCount'
import { NAV_LINKS } from '@/lib/home-data'
import { scrollToTarget } from '@/lib/scroll'

/** Barra fija clara, siempre visible. */
export default function SiteHeader() {
  const bagCount = useBagCount()
  const lenisRef = useLenisRef()

  return (
    <header data-site-header className="fixed inset-x-0 top-0 z-50 bg-background/95 backdrop-blur-md">
      <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center px-5 md:h-[86px] md:px-[60px]">
        <div className="flex items-center">
          <button type="button" aria-label="Open menu" className="-ml-1 p-1 md:hidden">
            <MenuIcon className="size-6" />
          </button>
          <nav aria-label="Main" className="hidden items-center gap-5 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs uppercase tracking-[0.02em] transition-opacity hover:opacity-60"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <a
          href="#"
          onClick={(event) => {
            event.preventDefault()
            scrollToTarget(lenisRef.current, 0)
          }}
          aria-label="Maili, back to top"
          className="font-serif text-[2rem] leading-none tracking-[-0.01em] md:text-[2.625rem]">
          Maili
        </a>

        <div className="flex items-center justify-end gap-4 md:gap-6">
          <button type="button" aria-label="Search" className="hidden p-1 transition-opacity hover:opacity-60 md:block">
            <SearchIcon className="size-[26px]" />
          </button>
          <button type="button" aria-label="Log in" className="hidden p-1 transition-opacity hover:opacity-60 md:block">
            <UserIcon className="size-[26px]" />
          </button>
          <button
            type="button"
            aria-label={`Bag, ${bagCount} ${bagCount === 1 ? 'item' : 'items'}`}
            className="relative p-1 transition-opacity hover:opacity-60"
          >
            <BagIcon className="size-6 md:size-[26px]" />
            {bagCount > 0 && (
              <span className="absolute -right-0.5 bottom-0 grid size-3.5 place-items-center rounded-full bg-accent text-[9px] leading-none text-white">
                {bagCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
