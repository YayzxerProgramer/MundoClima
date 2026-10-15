import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PrecioNivel, Producto } from '../types/api'

/** Copia mínima del producto para pintar el carrito sin volver a pedirlo. */
export interface ItemCarrito {
  producto_id: string
  slug: string
  nombre: string
  sku: string
  marca: string
  categoriaSlug: string | null
  imagen: string | null
  precio_base: number
  precios_nivel: PrecioNivel[]
  stock: number
  peso_kg: number
  cantidad: number
}

export const itemDesdeProducto = (p: Producto, cantidad: number): ItemCarrito => ({
  producto_id: p.id,
  slug: p.slug,
  nombre: p.nombre,
  sku: p.sku,
  marca: p.marca?.nombre ?? '',
  categoriaSlug: p.categoria?.slug ?? null,
  imagen: p.imagenes?.[0] ?? null,
  precio_base: Number(p.precio_base),
  precios_nivel: p.precios_nivel ?? [],
  stock: p.inventario_stock,
  peso_kg: Number(p.peso_kg) || 0,
  cantidad,
})

interface EstadoCarrito {
  items: ItemCarrito[]
  /** Devuelve false si ya estaban todas las unidades disponibles. */
  agregar: (p: Producto, cantidad: number) => boolean
  cambiarCantidad: (productoId: string, cantidad: number) => void
  quitar: (productoId: string) => void
  reemplazar: (items: ItemCarrito[]) => void
  /** Refresca stock y precios con la versión actual del producto. */
  sincronizar: (p: Producto) => void
  vaciar: () => void
}

export const useCarrito = create<EstadoCarrito>()(
  persist(
    (set, get) => ({
      items: [],
      agregar: (p, cantidad) => {
        const actual = get().items.find((i) => i.producto_id === p.id)
        if (actual && actual.cantidad >= p.inventario_stock) return false
        set((s) => {
          if (!actual) return { items: [...s.items, itemDesdeProducto(p, Math.min(cantidad, p.inventario_stock))] }
          return {
            items: s.items.map((i) =>
              i.producto_id === p.id
                ? { ...itemDesdeProducto(p, 0), cantidad: Math.min(p.inventario_stock, i.cantidad + cantidad) }
                : i,
            ),
          }
        })
        return true
      },
      cambiarCantidad: (productoId, cantidad) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.producto_id === productoId ? { ...i, cantidad: Math.max(1, Math.min(i.stock, cantidad)) } : i,
          ),
        })),
      quitar: (productoId) => set((s) => ({ items: s.items.filter((i) => i.producto_id !== productoId) })),
      reemplazar: (items) => set({ items }),
      sincronizar: (p) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.producto_id === p.id
              ? { ...itemDesdeProducto(p, 0), cantidad: Math.max(1, Math.min(p.inventario_stock || 1, i.cantidad)) }
              : i,
          ),
        })),
      vaciar: () => set({ items: [] }),
    }),
    { name: 'mc-carrito' },
  ),
)
