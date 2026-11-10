'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { cx } from '@/components/admin/ui'

const LINKS = [
  { href: '/admin', label: 'Productos', match: (path: string) => path === '/admin' || path.startsWith('/admin/products') },
  { href: '/admin/categories', label: 'Categorías', match: (path: string) => path.startsWith('/admin/categories') },
  { href: '/admin/collections', label: 'Colecciones', match: (path: string) => path.startsWith('/admin/collections') },
]

/** Barra lateral en escritorio; en móvil se vuelve una fila superior con scroll horizontal. */
export default function AdminNav({ email }: { email: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    await createClient().auth.signOut()
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <aside className="border-b border-neutral-200 bg-white md:fixed md:inset-y-0 md:left-0 md:flex md:w-60 md:flex-col md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-5 py-4 md:block md:py-6">
        <Link href="/admin" className="flex items-baseline gap-2">
          <span className="font-serif text-2xl leading-none text-neutral-900">Maili</span>
          <span className="text-xs font-medium uppercase tracking-widest text-neutral-400">Admin</span>
        </Link>
        <div className="flex items-center gap-4 md:mt-3 md:block">
          <a href="/" target="_blank" rel="noreferrer" className="text-xs text-neutral-500 hover:text-neutral-900">
            Ver tienda ↗
          </a>
          <button type="button" onClick={logout} className="text-xs font-medium text-neutral-700 hover:text-neutral-900 md:hidden">
            Salir
          </button>
        </div>
      </div>

      <nav aria-label="Panel" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:pb-0">
        {LINKS.map((link) => {
          const active = link.match(pathname)
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'shrink-0 rounded-md px-3 py-2 text-sm transition-colors',
                active ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
              )}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="hidden border-t border-neutral-100 px-5 py-4 md:block">
        <p className="truncate text-xs text-neutral-500" title={email}>
          {email}
        </p>
        <button type="button" onClick={logout} className="mt-2 text-xs font-medium text-neutral-700 hover:text-neutral-900">
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
