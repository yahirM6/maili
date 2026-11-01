'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function VariantForm({ productId }: { productId: string }) {
    const router = useRouter()
    const supabase = createClient()

    // Estados locales para nuestro formulario
    const [material, setMaterial] = useState('Plata 925')
    const [size, setSize] = useState('7')
    const [price, setPrice] = useState(0)
    const [stock, setStock] = useState(1)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Generamos un SKU automático básico para control de inventario
        const sku = `SKU-${material.substring(0,3).toUpperCase()}-${size}-${Math.floor(Math.random() * 1000)}`

        const { error } = await supabase
        .from('product_variants')
        .insert([{
            product_id: productId, // ← La llave que une esta variante con el anillo
            sku: sku,
            material: material,
            size: size,
            price: price,
            stock_quantity: stock,
        }])

        if (error) {
        alert(`Error al guardar la variante: ${error.message}`)
        } else {
        // Éxito: refrescamos para que la tabla superior se actualice
        router.refresh()
        // Reseteamos campos numéricos para facilitar la entrada de otra variante
        setPrice(0)
        setStock(1)
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-4">Agregar Nueva Variante</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
            <label className="block text-xs text-gray-500 mb-1">Material</label>
            <input 
                type="text" 
                value={material} 
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full border p-2 rounded text-sm" required 
            />
            </div>
            <div>
            <label className="block text-xs text-gray-500 mb-1">Talla</label>
            <input 
                type="text" 
                value={size} 
                onChange={(e) => setSize(e.target.value)}
                className="w-full border p-2 rounded text-sm" required 
            />
            </div>
            <div>
            <label className="block text-xs text-gray-500 mb-1">Precio ($)</label>
            <input 
                type="number" 
                value={price} 
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full border p-2 rounded text-sm" required min="0" 
            />
            </div>
            <div>
            <label className="block text-xs text-gray-500 mb-1">Stock (Cantidad)</label>
            <input 
                type="number" 
                value={stock} 
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full border p-2 rounded text-sm" required min="1" 
            />
            </div>
        </div>

        <div className="flex justify-end">
            <button 
            type="submit" 
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800 disabled:bg-gray-400"
            >
            {loading ? 'Agregando...' : '+ Agregar Variante'}
            </button>
        </div>
        </form>
    )
    }