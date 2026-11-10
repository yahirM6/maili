import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import AdminNav from '@/components/admin/AdminNav'
import { Toaster } from '@/components/admin/Toaster'
import { requireAdmin } from '@/lib/admin/auth'

export const metadata: Metadata = {
  title: { default: 'Admin · Maili', template: '%s · Admin Maili' },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = await requireAdmin()

  return (
    <Toaster>
      <div className="min-h-svh bg-[#f6f5f3] font-sans text-neutral-900 antialiased">
        <AdminNav email={user.email ?? ''} />
        <main className="px-4 py-6 md:ml-60 md:px-10 md:py-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </Toaster>
  )
}
