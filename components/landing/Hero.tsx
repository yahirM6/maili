// Hero.tsx
import Image from 'next/image'

export default function Hero() {
  return (
    <section className="relative isolate mt-16 h-[calc(100svh-4rem)] min-h-120 overflow-hidden bg-neutral-100 md:mt-[86px] md:h-[calc(100svh-86px)]">
      <Image
        src="/images/hero/hero-section.jpg"
        alt="Model wearing Maili jewelry"
        fill
        preload
        sizes="100vw"
        className="object-cover object-[70%_center]"
      />
      {/* En móvil el texto cae sobre la foto: velo para mantener la legibilidad */}
      <div aria-hidden="true" className="absolute inset-0 bg-white/40 md:hidden" />

      <div className="relative z-10 flex h-full max-w-[36rem] flex-col items-start justify-center px-5 md:px-[60px] lg:ml-[80px] lg:px-0">
        <h1 className="font-serif text-5xl leading-[1.05] tracking-[-0.01em] text-neutral-800 md:text-6xl">
          Jewelry That Speaks for You
        </h1>
        <p className="mt-6 max-w-[28rem] font-serif text-lg leading-snug text-neutral-800">
          Create bold accents with exquisite pieces that highlight your individuality.
        </p>
        <a
          href="#catalog"
          className="mt-10 bg-neutral-800 px-9 py-4 text-sm uppercase tracking-[0.02em] text-white transition-opacity hover:opacity-80"
        >
          Shop now
        </a>
      </div>
    </section>
  )
}
