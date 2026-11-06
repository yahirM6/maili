import Image from 'next/image'
import { formatPrice, type Product } from '@/lib/home-data'

interface ProductCardProps {
  product: Product
  sizes: string
}

const FIT_CLASSES: Record<Product['fit'], string> = {
  contain: 'object-contain p-[9%]',
  cover: 'object-cover',
  soft: 'object-contain p-[9%] [mask-image:radial-gradient(closest-side,#000_72%,transparent)]',
}

export default function ProductCard({ product, sizes }: ProductCardProps) {
  return (
    <a href={product.href} className="group block">
      <div className="relative aspect-[324/430] overflow-hidden bg-tile">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes={sizes}
          // brightness lleva a blanco puro los fondos casi blancos de las fotos;
          // multiply los funde con el gris cálido de la tarjeta
          className={`${FIT_CLASSES[product.fit]} mix-blend-multiply brightness-[1.08] transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]`}
        />
      </div>
      <p className="mt-3.5 font-garamond text-[15px] leading-[1.35] md:text-[clamp(17px,1.05vw,20px)]">{product.name}</p>
      <p className="mt-0.5 font-garamond text-[15px] leading-[1.35] md:text-[clamp(16px,1vw,19px)]">{formatPrice(product.price)}</p>
    </a>
  )
}
