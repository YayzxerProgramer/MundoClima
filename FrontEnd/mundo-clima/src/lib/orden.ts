import type { Orden } from '../types/api'
import { ESTADO_ORDEN } from './constantes'
import { plural } from './formato'

export const etiquetaEstado = (o: Pick<Orden, 'estado'>) => ESTADO_ORDEN[o.estado] ?? ESTADO_ORDEN.PENDIENTE_PAGO

export const textoMetodo = (o: Pick<Orden, 'metodo_pago'>) =>
  o.metodo_pago === 'WOMPI' ? 'Pago en línea (Wompi)' : 'Contraentrega'

export const unidadesOrden = (o: Pick<Orden, 'items'>) =>
  plural(o.items.reduce((a, i) => a + i.cantidad, 0), 'producto', 'productos')

/** Barra de progreso del pedido: creado → pagado/confirmado → en camino → entregado. */
export function pasosOrden(o: Pick<Orden, 'estado' | 'metodo_pago'>) {
  const idx = { PENDIENTE_PAGO: 0, PAGADO: 1, CONFIRMADO_CONTRAENTREGA: 1, EN_CAMINO: 2, ENTREGADO: 3, CANCELADO: 0 }[o.estado] ?? 0
  const labels = ['Pedido creado', o.metodo_pago === 'WOMPI' ? 'Pago aprobado' : 'Confirmado contraentrega', 'En camino', 'Entregado']
  return labels.map((label, i) => ({
    label,
    activo: o.estado !== 'CANCELADO' && i <= idx,
    hecho: i <= idx,
    actual: i === idx,
  }))
}

export const puedePagar = (o: Pick<Orden, 'estado' | 'metodo_pago'>) => o.metodo_pago === 'WOMPI' && o.estado === 'PENDIENTE_PAGO'
