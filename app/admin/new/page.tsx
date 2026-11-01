'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function NewProductMegaForm() {
    const router = useRouter()
    const supabase = createClient()

    // 1. Memoria atada estrictamente a tu tabla `products`
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        description: '',
        category_id: '', // Relación con tu tabla categories
        is_active: true,
        allow_engraving: false,
        max_engraving_chars: 0,
    })

    // Lista de categorías que traeremos de tu base de datos
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
    
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // 2. Cargar las categorías apenas se abre la página
    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase.from('categories').select('id, name')
            if (data) setCategories(data)
        }
        fetchCategories()
    }, [])

    // 3. Manejador Universal de inputs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        setFormData(prev => ({ ...prev, [name]: val }))
    }

    // 4. Automatización: Título -> Slug
    useEffect(() => {
        if (!formData.title) {
            setFormData(prev => ({ ...prev, slug: '' }))
            return
        }
        const generatedSlug = formData.title
            .toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
            
        setFormData(prev => ({ ...prev, slug: generatedSlug }))
    }, [formData.title])

    // 5. Inserción a tu tabla real `products`
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const { data, error: insertError } = await supabase
                .from('products')
                .insert([{
                    title: formData.title,
                    slug: formData.slug,
                    description: formData.description || null,
                    category_id: formData.category_id || null, // Si está vacío, manda null
                    is_active: formData.is_active,
                    allow_engraving: formData.allow_engraving,
                    max_engraving_chars: formData.allow_engraving ? Number(formData.max_engraving_chars) : 0,
                    // image_url se deja vacío por ahora, se llena al subir la foto en la vista Edit
                }])
                .select()
                .single()

            if (insertError) throw insertError
            
            // Éxito: Vamos al paso 2 para agregar precios, tallas e imágenes
            router.push(`/admin/edit/${data.slug}`)
        } catch (err: any) {
            setError(err.message || 'Error al guardar el producto. Verifica que el Slug no esté repetido.')
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-[#F8F9FA] py-10 px-6 font-sans">
            <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
                
                {/* Header Superior */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link href="/admin" className="text-sm text-gray-500 hover:text-black mb-2 inline-block">
                            ← Volver al inventario
                        </Link>
                        <h1 className="text-3xl font-medium text-gray-900 tracking-tight">Datos Base del Producto</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50">
                            {loading ? 'Creando...' : 'Guardar y agregar variantes →'}
                        </button>
                    </div>
                </div>

                {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

                {/* Grid Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* COLUMNA IZQUIERDA: BLOQUES DE EDICIÓN */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Bloque 1: Información General */}
                        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-medium text-gray-900 mb-5">Información General</h2>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la pieza *</label>
                                    <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black outline-none" placeholder="Ej. Anillo de Compromiso Aurora" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                    <select name="category_id" value={formData.category_id} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black outline-none bg-white">
                                        <option value="">Sin categoría...</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                    <textarea rows={4} name="description" value={formData.description} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black outline-none" placeholder="Cuenta la historia de la pieza, su inspiración y detalles de diseño..."></textarea>
                                </div>
                            </div>
                        </section>

                        {/* Bloque 2: Personalización (Joyería) */}
                        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-medium text-gray-900 mb-5">Servicios Adicionales</h2>
                            <div className="space-y-4">
                                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                    <div>
                                        <p className="font-medium text-gray-900">Grabado Láser</p>
                                        <p className="text-sm text-gray-500">Permitir al cliente agregar texto o iniciales en esta pieza.</p>
                                    </div>
                                    <input type="checkbox" name="allow_engraving" checked={formData.allow_engraving} onChange={handleChange} className="w-5 h-5 accent-black" />
                                </label>

                                {formData.allow_engraving && (
                                    <div className="pl-4 pt-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Máximo de caracteres permitidos</label>
                                        <input type="number" min="1" max="100" name="max_engraving_chars" value={formData.max_engraving_chars} onChange={handleChange} className="w-32 p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black outline-none" />
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* COLUMNA DERECHA: CONFIGURACIÓN Y SEO */}
                    <div className="space-y-6">
                        
                        {/* Estado */}
                        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-sm font-medium text-gray-900 mb-4 uppercase tracking-wider">Estado en Tienda</h2>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-5 h-5 accent-black" />
                                <span className={`font-medium ${formData.is_active ? 'text-green-700' : 'text-gray-500'}`}>
                                    {formData.is_active ? 'Visible al público' : 'Oculto (Borrador)'}
                                </span>
                            </label>
                        </section>

                        {/* Motor de Búsqueda */}
                        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-sm font-medium text-gray-900 mb-4 uppercase tracking-wider">Identificador Web</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL amigable (Slug)</label>
                                <input type="text" value={formData.slug} readOnly className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 outline-none text-sm" />
                                <p className="text-xs text-gray-400 mt-2">Esta será la dirección web de tu producto: /products/{formData.slug || '...'}</p>
                            </div>
                        </section>

                    </div>
                </div>
            </form>
        </main>
    )
}