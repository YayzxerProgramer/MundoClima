import type { Producto } from '../types/api'
import { fmtN } from './formato'

export function chipsProducto(p: Producto) {
  const chips = [p.btu ? `${fmtN(p.btu)} BTU` : null, p.voltaje, p.tipo_refrigerante].filter(Boolean) as string[]
  if (!chips.length) Object.values(p.especificaciones ?? {}).slice(0, 2).forEach((v) => chips.push(String(v)))
  return chips.slice(0, 3)
}

export function estadoStock(p: Producto) {
  const agotado = p.inventario_stock <= 0
  const bajo = !agotado && p.inventario_stock <= p.alerta_stock_minimo
  return {
    agotado,
    bajo,
    msgBajo: `¡Últimas ${p.inventario_stock} unidades!`,
    texto: agotado ? 'Agotado' : bajo ? `¡Últimas ${p.inventario_stock} unidades!` : `Disponible · ${p.inventario_stock} en stock`,
    color: agotado ? '#5E6F81' : bajo ? '#8A5A00' : '#2E7D32',
    icono: agotado ? 'do_not_disturb_on' : bajo ? 'warning' : 'check_circle',
  }
}
