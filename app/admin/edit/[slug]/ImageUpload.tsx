'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function ImageUpload({ productId, currentImage }: { productId: string, currentImage?: string | null }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
        setLoading(true)
        
        // 1. Verificamos que el usuario haya seleccionado un archivo
        const file = e.target.files?.[0]
        if (!file) return

        // 2. Creamos un nombre único para evitar que dos fotos se sobrescriban
        const fileExt = file.name.split('.').pop()
        const fileName = `${productId}-${Math.random()}.${fileExt}`
        const filePath = `anillos/${fileName}`

        // 3. Subimos el archivo físico al bucket 'products'
        const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, file)

        if (uploadError) throw uploadError

        // 4. Obtenemos el link público para que cualquiera pueda verla
        const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(filePath)

        // 5. Guardamos el link en nuestra tabla de productos
        const { error: updateError } = await supabase
            .from('products')
            .update({ image_url: publicUrl })
            .eq('id', productId)

        if (updateError) throw updateError

        // 6. Refrescamos la pantalla para mostrar la foto recién subida
        router.refresh()
        } catch (error: any) {
        alert(`Error al subir imagen: ${error.message}`)
        } finally {
        setLoading(false)
        }
    }

    return (
        <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="font-medium text-gray-900 mb-4">Fotografía Principal</h3>
        
        {currentImage ? (
            <div className="mb-4">
            <img 
                src={currentImage} 
                alt="Producto" 
                className="w-48 h-48 object-cover rounded-md border border-gray-200"
            />
            </div>
        ) : (
            <div className="mb-4 w-48 h-48 bg-gray-100 flex items-center justify-center rounded-md border border-gray-200 border-dashed">
            <span className="text-gray-400 text-sm">Sin imagen</span>
            </div>
        )}

        <div>
            <label className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800 cursor-pointer inline-block">
            {loading ? 'Subiendo...' : currentImage ? 'Cambiar Foto' : 'Subir Foto'}
            {/* El input real está oculto, usamos el label como botón estilizado */}
            <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleUpload}
                disabled={loading}
            />
            </label>
        </div>
        </div>
    )
    }