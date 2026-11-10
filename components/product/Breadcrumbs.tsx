import Link from 'next/link'
import { ChevronRight } from '@/components/landing/icons'

export interface Crumb {
  label: string
  href?: string
}

/** Home > Catalog > Rings > Eternal Ring. El último (página actual) no es enlace. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-foreground/70">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="size-3 text-foreground/40" />}
            {item.href && index < items.length - 1 ? (
              <Link href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span aria-current={index === items.length - 1 ? 'page' : undefined} className="text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
