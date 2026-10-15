import { create } from 'zustand'

export interface AccionToast {
  label: string
  fn: () => void
}

interface EstadoUI {
  miniCarrito: boolean
  menuMovil: boolean
  toast: { id: number; msg: string; accion?: AccionToast } | null
  /** Producto recién agregado: los botones muestran "Agregado" un momento. */
  agregado: string | null
  rebote: boolean
  abrirMiniCarrito: () => void
  abrirMenuMovil: () => void
  cerrarPaneles: () => void
  avisar: (msg: string, accion?: AccionToast) => void
  cerrarToast: () => void
  marcarAgregado: (productoId: string) => void
}

let tToast: ReturnType<typeof setTimeout> | undefined
let tAgregado: ReturnType<typeof setTimeout> | undefined
let tRebote: ReturnType<typeof setTimeout> | undefined

export const useUI = create<EstadoUI>()((set) => ({
  miniCarrito: false,
  menuMovil: false,
  toast: null,
  agregado: null,
  rebote: false,
  abrirMiniCarrito: () => set({ miniCarrito: true }),
  abrirMenuMovil: () => set({ menuMovil: true }),
  cerrarPaneles: () => set({ miniCarrito: false, menuMovil: false }),
  avisar: (msg, accion) => {
    clearTimeout(tToast)
    set({ toast: { id: Date.now(), msg, accion } })
    tToast = setTimeout(() => set({ toast: null }), 3000)
  },
  cerrarToast: () => set({ toast: null }),
  marcarAgregado: (productoId) => {
    clearTimeout(tAgregado)
    clearTimeout(tRebote)
    set({ agregado: productoId, rebote: true })
    tAgregado = setTimeout(() => set({ agregado: null }), 1800)
    tRebote = setTimeout(() => set({ rebote: false }), 220)
  },
}))
