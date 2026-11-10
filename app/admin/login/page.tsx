'use client'

import { Suspense, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Field, Input } from '@/components/admin/ui'
import { createClient } from '@/utils/supabase/client'

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-[#f6f5f3] px-4 font-sans text-neutral-900 antialiased">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-center">
          <span className="font-serif text-4xl">Maili</span>
          <span className="ml-2 text-xs font-medium uppercase tracking-widest text-neutral-400">Admin</span>
        </p>
        {/* useSearchParams necesita Suspense para no forzar el render dinámico de toda la página */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(
    params.get('error') === 'no-admin' ? 'Esta cuenta no tiene acceso al panel.' : null,
  )

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setPending(true)
    const supabase = createClient()

    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError(loginError.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : loginError.message)
    } else if (data.user?.app_metadata?.role !== 'admin') {
      // Credenciales válidas, pero la cuenta no es de administrador: se cierra la sesión
      await supabase.auth.signOut()
      setError('Esta cuenta no tiene acceso al panel.')
    } else {
      router.push('/admin')
      router.refresh()
      return
    }
    setPending(false)
  }

  return (
    <form onSubmit={handleLogin} className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-6">
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <Field label="Correo" htmlFor="email">
        <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </Field>
      <Field label="Contraseña" htmlFor="password">
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </Field>
      <Button type="submit" variant="primary" disabled={pending} className="mt-2 w-full">
        {pending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
