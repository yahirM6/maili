'use client'

import { useSyncExternalStore } from 'react'
import { useCartStore } from '@/store/cartStore'

// El carrito vive en localStorage: el servidor siempre pinta 0 y el cliente corrige sin error de hidratación
const subscribe = (onChange: () => void) => useCartStore.subscribe(onChange)
const getCount = () => useCartStore.getState().items.reduce((total, item) => total + item.quantity, 0)
const getServerCount = () => 0

export function useBagCount() {
  return useSyncExternalStore(subscribe, getCount, getServerCount)
}
