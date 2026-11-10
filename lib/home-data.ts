// Contenido fijo de la home. Nombres y precios son de muestra: edítalos aquí sin tocar componentes.

export interface Product {
  id: string
  name: string
  price: number
  image: string
  href: string
  /**
   * contain: la pieza flota centrada con aire alrededor (fotos de fondo blanco).
   * cover: la foto llena la tarjeta; para cadenas que salen de cuadro o fotos con bordes.
   * soft: como contain, pero difumina los bordes de la foto; para fondos tintados o con sombra.
   */
  fit: 'contain' | 'cover' | 'soft'
}

export interface Collection {
  id: string
  name: string
  image: string
  alt: string
  href: string
  /** Encuadre de la foto dentro de la celda */
  objectPosition?: string
}

export interface FooterColumn {
  title: string
  links: { label: string; href: string }[]
}

const product = (id: string, name: string, price: number, fit: Product['fit'] = 'contain'): Product => ({
  id,
  name,
  price,
  image: `/images/products/${id}.jpg`,
  href: '#',
  fit,
})

export const PRODUCTS = {
  'earrings-ovalo': product('earrings-ovalo', 'Gold Oval Link Drop Earrings', 48),
  'earrings-estrella': product('earrings-estrella', 'Gold Starfish Stud Earrings', 38),
  'bracelets-onda': product('bracelets-onda', 'Gold Wave Flow Bangle', 42),
  'bracelets-2': product('bracelets-2', 'Gold Sculpted Wave Cuff', 55),
  'bracelets-3': product('bracelets-3', 'Gold Organic Open Cuff', 46),
  'bracelets-reloj': product('bracelets-reloj', 'Gold Petite Oval Watch', 68),
  'necklaces-esmeralda': product('necklaces-esmeralda', 'Gold Emerald Link Necklace', 62, 'cover'),
  'necklaces-flor': product('necklaces-flor', 'Gold Daisy Pendant Necklace', 44, 'cover'),
  'necklaces-heart': product('necklaces-heart', 'Gold Solitaire Heart Necklace', 40, 'cover'),
  'ring-chunky': product('ring-chunky', 'Gold Engraved Chunky Ring', 52),
  'ring-chunky2': product('ring-chunky2', 'Gold Sculptural Pebble Ring', 49, 'soft'),
  'ring-onda': product('ring-onda', 'Gold Wave Ring', 36, 'cover'),
} satisfies Record<string, Product>

type ProductId = keyof typeof PRODUCTS
const pick = (ids: ProductId[]) => ids.map((id) => PRODUCTS[id])

export const NEW_IN = pick([
  'earrings-ovalo',
  'bracelets-onda',
  'earrings-estrella',
  'ring-chunky2',
  'necklaces-flor',
  'bracelets-3',
  'ring-onda',
  'necklaces-esmeralda',
])

export const BESTSELLERS = pick([
  'earrings-estrella',
  'ring-onda',
  'bracelets-2',
  'necklaces-heart',
  'bracelets-reloj',
  'ring-chunky',
  'necklaces-flor',
  'earrings-ovalo',
])

/** Se muestran de 4 en 4; las flechas pasan de página */
export const MOLTEN = pick([
  'bracelets-2',
  'necklaces-heart',
  'earrings-ovalo',
  'ring-chunky',
  'bracelets-onda',
  'necklaces-esmeralda',
  'earrings-estrella',
  'ring-chunky2',
])

export const COLLECTIONS: Collection[] = [
  {
    id: 'bracelets',
    name: 'Bracelets',
    image: '/images/model/bracelets-collection.jpg',
    alt: 'Model holding a sculpted gold cuff in front of her face',
    href: '#',
  },
  {
    id: 'necklaces',
    name: 'Necklaces',
    image: '/images/model/necklaces-collection.jpg',
    alt: 'Model in pink lace holding a fine gold necklace',
    href: '#',
  },
  {
    id: 'rings',
    name: 'Rings',
    image: '/images/model/rings-collection.jpg',
    alt: 'Model resting her chin on her hand, wearing a gold bangle',
    href: '#',
  },
  {
    id: 'earrings',
    name: 'Earrings',
    image: '/images/model/earrings-collection.jpg',
    alt: 'Model wearing sculptural gold earrings',
    href: '#',
  },
]

export const EDITORIAL = {
  image: '/images/model/model-horizontal.jpg',
  alt: 'Model in burgundy lace lying down, wearing gold rings and bracelets',
  /** Pie que se ve bajo la foto mientras es pequeña; la foto lo cubre al crecer */
  caption: 'The Lace Edit',
  cta: { label: 'Discover', href: '#' },
  /** Texto gigante y tenue que cruza detrás de la foto */
  marquee: 'Maili · Fine Jewelry · Maili · Fine Jewelry ·',
}

export const MOLTEN_FEATURE = {
  title: 'Molten',
  subtitle: 'Classic jewelry to embody timeless elegance',
  image: '/images/model/molten-collection.jpg',
  alt: 'Model wearing layered gold pendant necklaces',
  href: '#',
}

export const NAV_LINKS = [
  { label: 'Catalog', href: '#catalog' },
  { label: 'About Us', href: '#' },
  { label: 'Showrooms', href: '#' },
]

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Catalog',
    links: ['New In', 'Earrings', 'Rings', 'Necklaces', 'Bracelets', 'Charms', 'Personalization', 'Collections', 'Gifting'].map(
      (label) => ({ label, href: '#' }),
    ),
  },
  {
    title: 'Information',
    links: ['About Us', 'Delivery & Returns', 'Terms & Conditions', 'Privacy Policy', 'Payment & FAQs'].map((label) => ({
      label,
      href: '#',
    })),
  },
  {
    title: 'Showrooms',
    links: ['Store Addresses', 'Contact Us'].map((label) => ({ label, href: '#' })),
  },
]

export const SOCIAL_LINKS = [
  { id: 'facebook', label: 'Facebook', href: '#' },
  { id: 'instagram', label: 'Instagram', href: '#' },
  { id: 'pinterest', label: 'Pinterest', href: '#' },
] as const

export const formatPrice = (value: number) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
