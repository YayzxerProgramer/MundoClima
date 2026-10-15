import type { NivelPrecio, PrecioNivel } from '../types/api'
import { ETIQUETA_PRECIO } from './constantes'

export interface PrecioCalculado {
  aplicado: number
  base: number
  b2b: boolean
  ahorro: number
  pct: number
  etiqueta: string
}

/**
 * Misma regla que el backend (calcularPreciosPorNivelB2B y calcularPrecioUnitarioB2B):
 * solo cuenta el precio del nivel con cantidad_minima === 1.
 * Se usa en el carrito, donde el producto guardado puede ser de antes de iniciar sesión.
 * El precio que se cobra lo recalcula el backend al crear la orden.
 */
export function calcularPrecio(
  producto: { precio_base: number | string; precios_nivel?: PrecioNivel[] | null },
  nivel: NivelPrecio,
): PrecioCalculado {
  const base = Number(producto.precio_base)
  let aplicado = base
  if (nivel !== 'CLIENTE_FINAL') {
    const tier = producto.precios_nivel?.find((p) => p.nivel_cliente === nivel && p.cantidad_minima === 1)
    if (tier) aplicado = Number(tier.precio_especial)
  }
  const ahorro = Math.max(0, base - aplicado)
  return {
    aplicado,
    base,
    b2b: aplicado < base,
    ahorro,
    pct: base > 0 ? Math.round((ahorro / base) * 100) : 0,
    etiqueta: aplicado < base ? (ETIQUETA_PRECIO[nivel] ?? '') : '',
  }
}
