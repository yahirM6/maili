import { FacebookIcon, InstagramIcon, PinterestIcon } from '@/components/landing/icons'
import { FOOTER_COLUMNS, SOCIAL_LINKS } from '@/lib/home-data'

const SOCIAL_ICONS = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  pinterest: PinterestIcon,
}

export default function Footer() {
  return (
    <footer className="bg-background px-5 pb-16 pt-8 md:px-[60px] md:pb-20 md:pt-[42px]">
      <div className="grid grid-cols-2 gap-y-10 border-t border-line pt-10 md:grid-cols-[minmax(0,406fr)_199fr_199fr_199fr_minmax(0,317fr)] md:gap-y-0">
        <div className="col-span-2 flex items-start justify-between md:col-span-1 md:block">
          <div>
            <p className="font-serif text-[2.75rem] font-normal leading-none tracking-[-0.01em]">Maili</p>
            <p className="mt-6 text-sm">© {new Date().getFullYear()} Maili. All rights reserved.</p>
          </div>
          <SocialLinks className="md:hidden" />
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="font-garamond text-[1.375rem] font-medium leading-none">{column.title}</h2>
            <ul className="mt-5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="inline-block py-[3.5px] text-sm transition-opacity hover:opacity-60">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <SocialLinks className="hidden justify-end md:flex" />
      </div>
    </footer>
  )
}

function SocialLinks({ className = '' }: { className?: string }) {
  return (
    <ul className={`flex items-start gap-6 ${className}`}>
      {SOCIAL_LINKS.map((social) => {
        const Icon = SOCIAL_ICONS[social.id]
        return (
          <li key={social.id}>
            <a href={social.href} aria-label={social.label} className="block text-accent transition-opacity hover:opacity-70">
              <Icon className="size-7" />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
