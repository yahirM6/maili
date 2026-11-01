'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

// Definimos la forma de los datos (TypeScript) para ayudar al autocompletado
type Category = { id: string; name: string }

export default function NewProductForm({ categories }: { categories: Category[] }) {
    const router = useRouter()
    const supabase = createClient()
    
    // Estados para los campos del formulario
    const [title, setTitle] = useState('')
    const [slug, setSlug] = useState('')
    const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Insertamos la fila en la tabla 'products'
        const { error } = await supabase
        .from('products')
        .insert([
            { 
            title: title, 
            slug: slug, 
            category_id: categoryId, 
            is_active: true, // Por defecto entra como activo
            allow_engraving: false
            }
        ])

        if (error) {
        alert(`Error al guardar: ${error.message}`)
        setLoading(false)
        } else {
        // Si fue exitoso, refrescamos los datos y volvemos a la tabla
        router.refresh()
        router.push('/admin')
        }
    }

    // Función auxiliar para auto-generar el slug a partir del título
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value
        setTitle(newTitle)
        // Convierte "Anillo de Oro" en "anillo-de-oro"
        setSlug(newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la joya</label>
            <input 
            type="text" 
            value={title}
            onChange={handleTitleChange}
            className="w-full border p-3 rounded-md focus:ring-black focus:border-black outline-none"
            required
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL Amigable (Slug)</label>
            <input 
            type="text" 
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full border p-3 rounded-md bg-gray-50 text-gray-600 outline-none"
            required
            />
            <p className="text-xs text-gray-400 mt-1">Ejemplo: tusitio.com/producto/{slug || '...'}</p>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            <select 
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border p-3 rounded-md focus:ring-black focus:border-black outline-none"
            >
            {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
            </select>
        </div>

        <div className="pt-4 border-t flex justify-end space-x-4">
            <button 
            type="button"
            onClick={() => router.push('/admin')}
            className="px-6 py-2 text-gray-600 hover:text-black font-medium"
            >
            Cancelar
            </button>
            <button 
            type="submit"
            disabled={loading}
            className="bg-black text-white px-8 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400"
            >
            {loading ? 'Guardando...' : 'Crear Producto'}
            </button>
        </div>
        </form>
    )
}