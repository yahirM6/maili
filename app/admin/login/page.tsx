'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AdminLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    
    const router = useRouter()
    // Usamos el cliente de navegador que creamos anteriormente
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Llamada a la API de Supabase para validar credenciales
        const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        })

        if (error) {
        setError(error.message)
        } else if (data.user?.app_metadata?.role !== 'admin') {
        // Credenciales válidas, pero la cuenta no es de administrador: se cierra la sesión
        await supabase.auth.signOut()
        setError('Esta cuenta no tiene acceso al panel.')
        } else {
        // Si el login es exitoso, Next.js nos lleva al panel protegido
        router.push('/admin')
        router.refresh()
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-96 space-y-4">
            <h1 className="text-2xl font-light text-center mb-6">Acceso Administrativo</h1>
            
            {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center">
                {error}
            </div>
            )}

            <div>
            <label className="block text-sm text-gray-600 mb-1">Correo</label>
            <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border p-2 rounded focus:outline-black"
                required
            />
            </div>

            <div>
            <label className="block text-sm text-gray-600 mb-1">Contraseña</label>
            <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border p-2 rounded focus:outline-black"
                required
            />
            </div>

            <button 
            type="submit"
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition-colors"
            >
            Entrar
            </button>
        </form>
        </main>
    )
    }