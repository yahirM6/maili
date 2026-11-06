import Collections from '@/components/landing/Collections'
import Editorial from '@/components/landing/Editorial'
import Footer from '@/components/landing/Footer'
import Hero from '@/components/landing/Hero'
import MoltenCollection from '@/components/landing/MoltenCollection'
import ProductCarousel from '@/components/landing/ProductCarousel'
import SiteHeader from '@/components/landing/SiteHeader'
import SmoothScroll from '@/components/landing/SmoothScroll'
import { BESTSELLERS, NEW_IN } from '@/lib/home-data'

// Home estática: todo el contenido sale de lib/home-data.ts
export default function Home() {
  return (
    <SmoothScroll>
      <SiteHeader />
      {/* z-10 y fondo propio: el contenido tapa al footer, que espera fijo detrás (se destapa al final) */}
      <main className="relative z-10 bg-background font-sans text-foreground">
        {/* Punto de snap en el tope para móvil: la hero es sticky y no sirve como área de snap */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px snap-start md:hidden" />
        <Hero />
        {/* Sube encima de la hero, que se queda fija (sticky) */}
        <div className="relative z-10 bg-background">
          <ProductCarousel id="catalog" title="New In" products={NEW_IN} />
          <Collections />
          <ProductCarousel title="Bestsellers" products={BESTSELLERS} />
          <Editorial />
          <MoltenCollection />
        </div>
      </main>
      <Footer />
    </SmoothScroll>
  )
}
