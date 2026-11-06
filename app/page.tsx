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
      <main className="bg-background font-sans text-foreground">
        <Hero />
        <ProductCarousel id="catalog" title="New In" products={NEW_IN} />
        <Collections />
        <ProductCarousel title="Bestsellers" products={BESTSELLERS} />
        <Editorial />
        <MoltenCollection />
      </main>
      <Footer />
    </SmoothScroll>
  )
}
