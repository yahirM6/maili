import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Favoritos guardados en el navegador (todavía no hay cuentas de cliente). */
interface WishlistState {
  ids: string[]
  toggle: (productId: string) => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (productId) =>
        set((state) => ({
          ids: state.ids.includes(productId) ? state.ids.filter((id) => id !== productId) : [...state.ids, productId],
        })),
    }),
    { name: 'wishlist' },
  ),
)
