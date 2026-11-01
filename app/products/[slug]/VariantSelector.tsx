'use client'

import { useState } from "react"
import type { Database } from "@/types/supabase"
import { useCartStore } from "@/store/cartStore"

type Variant = Database['public']['Tables']['product_variants']['Row']

export default function VariantSelector({
    variants,
    allowEngraving,
    productTitle
}:{
    variants: Variant[]
    allowEngraving: boolean | null
    productTitle:string
}){
    const [selectedVariant, setSelectedVariant,] = useState<Variant>(variants[0])
    const [engravingText, setEngraving] = useState('')

    const addItem = useCartStore((state)=> state.addItem)

    const handleAddToCart = () => {
        addItem({
        variant_id: selectedVariant.id,
        product_id: selectedVariant.product_id!,
        title: productTitle,
        material: selectedVariant.material,
        size: selectedVariant.size,
        price: selectedVariant.price,
        quantity: 1,
        max_stock: selectedVariant.stock_quantity,
        engraving_text: engravingText.trim() !== '' ? engravingText : undefined
        })
        alert('¡Agregado al carrito!')
    }

    return(
        <>
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Selecciona tu opción:
                </label>
                <select
                    className="w-full border-gray-300 rounded-md shadow-sm p-3 border focus:ring-black focus:border-black"
                    value={selectedVariant.id}
                    onChange={(e) => {
                        const variant = variants.find(v => v.id === e.target.value)
                        if (variant) setSelectedVariant(variant)
                    }}
                >
                    {variants.map(v => (
                        <option key={v.id} value={v.id}>
                            {v.material} - Talla {v.size} {v.gemstone ? `(${v.gemstone})` : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* Estado del Stock */}
            <div className="text-sm">
                {selectedVariant.stock_quantity > 0 ? (
                <span className="text-green-700 bg-green-50 px-3 py-1 rounded-full font-medium tracking-wide">
                    {selectedVariant.stock_quantity} en stock - Listo para enviar
                </span>
                ) : (
                <span className="text-red-700 bg-red-50 px-3 py-1 rounded-full font-medium tracking-wide">
                    Agotado por el momento
                </span>
                )}
            </div>

            {/* Grabado Personalizado (Si aplica) */}
            {allowEngraving && (
                <div className="pt-4 border-t">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grabado personalizado (Opcional)
                    </label>
                    <input 
                        type="text" 
                        placeholder="Ej. J & M 2026"
                        className="w-full border-gray-300 rounded-md shadow-sm p-3 border focus:ring-black focus:border-black"
                        value={engravingText} /* <-- CABLE 1: Conectamos el valor */
                        onChange={(e) => setEngraving(e.target.value)} /* <-- CABLE 1: Capturamos lo que el usuario escribe */
                    />
                </div>
            )}

            {/* Botón de Compra */}
            <button 
                onClick={handleAddToCart} /* <-- CABLE 2: Disparamos la función al hacer clic */
                disabled={selectedVariant.stock_quantity === 0}
                className="w-full bg-black text-white py-4 rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-medium tracking-wide mt-6"
            >
                {selectedVariant.stock_quantity === 0 ? 'Agotado' : 'Agregar al carrito'}
            </button>
        </>
    )

}