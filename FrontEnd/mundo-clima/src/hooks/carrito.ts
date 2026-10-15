import { useQueries } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNivel } from '../api/catalogo'
import { api } from '../lib/api'
import { calcularPrecio } from '../lib/precio'
import { useCarrito, type ItemCarrito } from '../store/carrito'
import { useUI } from '../store/ui'
import type { Producto } from '../types/api'

/** Agrega al carrito como en el diseño: desde la tarjeta avisa con un toast, desde la ficha abre el mini carrito. */
export function useAgregarAlCarrito() {
  const agregar = useCarrito((s) => s.agregar)
  const { avisar, marcarAgregado, abrirMiniCarrito } = useUI.getState()
  return (p: Producto, cantidad = 1, abrirMini = false) => {
    if (!agregar(p, cantidad)) {
      avisar(`Ya tienes las ${p.inventario_stock} unidades disponibles`)
      return
    }
    marcarAgregado(p.id)
    if (abrirMini) abrirMiniCarrito()
    else avisar('Agregado al carrito', { label: 'Ver carrito', fn: () => { useUI.getState().cerrarToast(); abrirMiniCarrito() } })
  }
}

export interface LineaCarrito {
  item: ItemCarrito
  unitario: number
  base: number
  b2b: boolean
  etiqueta: string
  total: number
}

/** Precios del carrito con el nivel de la sesión actual. */
export function useResumenCarrito() {
  const items = useCarrito((s) => s.items)
  const nivel = useNivel()
  const lineas: LineaCarrito[] = items.map((item) => {
    const p = calcularPrecio(item, nivel)
    return { item, unitario: p.aplicado, base: p.base, b2b: p.b2b, etiqueta: p.etiqueta, total: p.aplicado * item.cantidad }
  })
  return {
    lineas,
    subtotal: lineas.reduce((a, l) => a + l.total, 0),
    ahorro: lineas.reduce((a, l) => a + (l.base - l.unitario) * l.item.cantidad, 0),
    unidades: lineas.reduce((a, l) => a + l.item.cantidad, 0),
    pesoKg: items.reduce((a, i) => a + i.peso_kg * i.cantidad, 0),
  }
}

/**
 * El carrito guarda una copia del producto. En carrito y checkout se vuelve a pedir cada producto
 * para tener stock y precios vigentes; los que ya no existen se quitan.
 */
export function useSincronizarCarrito() {
  const ids = useCarrito((s) => s.items.map((i) => i.producto_id).join(','))
  const nivel = useNivel()
  const lista = ids ? ids.split(',') : []
  const consultas = useQueries({
    queries: lista.map((id) => ({
      queryKey: ['producto', nivel, id],
      queryFn: async () => (await api.get<Producto>(`/productos/${id}`)).data,
      staleTime: 30_000,
      retry: false,
    })),
  })
  const firma = consultas.map((c) => `${c.dataUpdatedAt}:${c.isError ? 'e' : ''}`).join('|')
  useEffect(() => {
    const { sincronizar, quitar } = useCarrito.getState()
    consultas.forEach((c, i) => {
      if (c.data) sincronizar(c.data)
      else if (c.isError && (c.error as { response?: { status?: number } }).response?.status === 404) quitar(lista[i])
    })
    // firma resume los cambios de las consultas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma])
}

/** Quitar con opción de deshacer. */
export function useQuitarDelCarrito() {
  return (productoId: string) => {
    const previo = useCarrito.getState().items
    useCarrito.getState().quitar(productoId)
    useUI.getState().avisar('Producto eliminado', {
      label: 'Deshacer',
      fn: () => { useCarrito.getState().reemplazar(previo); useUI.getState().cerrarToast() },
    })
  }
}
