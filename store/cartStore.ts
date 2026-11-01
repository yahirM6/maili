import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  variant_id: string
  product_id: string
  title: string
  material: string
  size: string | null
  price: number
  quantity: number
  max_stock: number
  engraving_text?: string
}

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (variant_id: string) => void
  clearCart: () => void
  getTotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (newItem) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.variant_id === newItem.variant_id)
          
          // Si ya está en el carrito, sumamos la cantidad (respetando el límite de stock real)
          if (existingItem) {
            return {
              items: state.items.map((item) => 
                item.variant_id === newItem.variant_id
                  ? { ...item, quantity: Math.min(item.quantity + newItem.quantity, item.max_stock) }
                  : item
              )
            }
          }
          
          // Si es nuevo, lo agregamos al arreglo
          return { items: [...state.items, newItem] }
        })
      },

      removeItem: (variant_id) => {
        set((state) => ({
          items: state.items.filter((item) => item.variant_id !== variant_id)
        }))
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
      }
    }),
    {
      name: 'cart-storage', // Nombre de la llave en localStorage
    }
  )
)