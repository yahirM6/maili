import type { SVGProps } from 'react'

// Iconos lineales finos al estilo de la navegación; heredan el color con currentColor
type IconProps = SVGProps<SVGSVGElement>

const base = (props: IconProps) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
})

export const ArrowLeft = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M20 12H4m6-6-6 6 6 6" />
  </svg>
)

export const ArrowRight = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M4 12h16m-6-6 6 6-6 6" />
  </svg>
)

export const SearchIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="10.5" cy="10.5" r="7" />
    <path d="m15.75 15.75 5.25 5.25" />
  </svg>
)

export const UserIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="9.5" />
    <circle cx="12" cy="9.5" r="3.25" />
    <path d="M6.2 18.9c1.3-2.3 3.4-3.6 5.8-3.6s4.5 1.3 5.8 3.6" />
  </svg>
)

export const BagIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M5.5 8h13l-1 13h-11l-1-13Z" />
    <path d="M9 10.5V6.5a3 3 0 0 1 6 0v4" />
  </svg>
)

export const MenuIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M3.5 8h17M3.5 16h17" />
  </svg>
)

// Redes: círculo o cuadro relleno con el glifo calado en el color del fondo
export const FacebookIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <circle cx="12" cy="12" r="11" fill="currentColor" />
    <path
      fill="var(--background)"
      d="M13.4 23v-8.2h2.6l.4-3.1h-3V9.8c0-.9.3-1.5 1.6-1.5h1.6V5.5c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.3H7.8v3.1h2.6V23Z"
    />
  </svg>
)

export const InstagramIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden {...props}>
    <rect x="2" y="2" width="20" height="20" rx="6" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="17.6" cy="6.4" r="0.6" fill="currentColor" stroke="none" />
  </svg>
)

export const PinterestIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <circle cx="12" cy="12" r="11" fill="currentColor" />
    <path
      fill="var(--background)"
      d="M12.3 5.2c-3.9 0-5.9 2.8-5.9 5.1 0 1.4.5 2.7 1.7 3.1.2.1.4 0 .4-.2l.2-.7c.1-.2 0-.3-.1-.5-.4-.4-.6-1-.6-1.8 0-2.3 1.7-4.4 4.5-4.4 2.5 0 3.8 1.5 3.8 3.5 0 2.6-1.2 4.9-2.9 4.9-1 0-1.7-.8-1.4-1.8.3-1.1.8-2.4.8-3.2 0-.7-.4-1.4-1.2-1.4-1 0-1.8 1-1.8 2.4 0 .9.3 1.5.3 1.5l-1.2 5.1c-.3 1.3-.1 2.9 0 3.6.1.1.2.1.2 0 .2-.2 1.4-1.7 1.8-3.2l.7-2.6c.3.6 1.3 1.2 2.4 1.2 3.1 0 5.2-2.8 5.2-6.6 0-2.9-2.4-5.6-6.3-5.6Z"
    />
  </svg>
)
