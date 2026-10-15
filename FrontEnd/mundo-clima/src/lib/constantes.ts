import type { EstadoOrden, NivelPrecio, Rol } from '../types/api'

/** imagen_url de las categorías llega null: cada slug tiene su ícono. */
const ICONO_CATEGORIA: Record<string, string> = {
  'aires-acondicionados': 'air-vent',
  compresores: 'cylinder',
  'gases-refrigerantes': 'snowflake',
  'componentes-electricos': 'zap',
  'valvulas-y-controles': 'gauge',
  'tuberia-y-aislamiento': 'cable',
  herramientas: 'wrench',
}
export const iconoCategoria = (slug: string | null | undefined) => (slug && ICONO_CATEGORIA[slug]) || 'package'

/** Las fotos de la semilla son genéricas; el diseño muestra el ícono de la categoría hasta tener fotos reales. */
export const MOSTRAR_FOTOS = import.meta.env.VITE_FOTOS_BACKEND === 'true'

/** ADMIN compra a precio público. */
export const nivelDeRol = (rol: Rol | null | undefined): NivelPrecio =>
  rol === 'TECNICO' || rol === 'DISTRIBUIDOR' ? rol : 'CLIENTE_FINAL'

export const ROL_LABEL: Record<Rol, string> = {
  ADMIN: 'Administrador',
  CLIENTE_FINAL: 'Cliente final',
  TECNICO: 'Cuenta Técnico',
  DISTRIBUIDOR: 'Cuenta Distribuidor',
}

export const ETIQUETA_PRECIO: Partial<Record<NivelPrecio, string>> = {
  TECNICO: 'Precio Técnico',
  DISTRIBUIDOR: 'Precio Distribuidor',
}

export const NIVEL_CORTO: Partial<Record<NivelPrecio, string>> = {
  TECNICO: 'Técnico',
  DISTRIBUIDOR: 'Distribuidor',
}

/** Colores [fondo, texto] de la etiqueta de nivel. */
export const TAG_NIVEL: Partial<Record<NivelPrecio, [string, string]>> = {
  TECNICO: ['#E3F4FA', '#0A598A'],
  DISTRIBUIDOR: ['#0A598A', '#FFFFFF'],
}

/** [etiqueta, fondo, texto] */
export const ESTADO_ORDEN: Record<EstadoOrden, [string, string, string]> = {
  PENDIENTE_PAGO: ['Pendiente de pago', '#FFF6E5', '#7A5200'],
  PAGADO: ['Pagado', '#E8F3E9', '#1E5E22'],
  CONFIRMADO_CONTRAENTREGA: ['Confirmado · contraentrega', '#E6F3FA', '#0A598A'],
  EN_CAMINO: ['En camino', '#E3F4FA', '#0A598A'],
  ENTREGADO: ['Entregado', '#E8F3E9', '#1E5E22'],
  CANCELADO: ['Cancelado', '#FBE9E9', '#C62828'],
}

export const ESTADO_ENVIO: Record<string, string> = {
  EN_TRANSITO: 'En tránsito',
  DESPACHADO: 'Despachado',
  ENTREGADO: 'Entregado',
}

export const DEPARTAMENTOS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá', 'Casanare',
  'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta',
  'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre',
  'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada',
]

/** Accesos rápidos de la barra de navegación. */
export const QUICK_LINKS: [string, string][] = [
  ['aires-acondicionados', 'Aires acondicionados'],
  ['compresores', 'Compresores'],
  ['gases-refrigerantes', 'Gases refrigerantes'],
  ['herramientas', 'Herramientas'],
]

/** Filtros técnicos que aplican a cada categoría (sin categoría aplican todos). */
export const CATS_BTU_TIPO = ['aires-acondicionados', 'compresores']
export const CATS_VOLT_REF = ['aires-acondicionados', 'compresores', 'gases-refrigerantes']

export const LIMITE_PAGINA = 12

/** Cuentas de la semilla del backend (solo en desarrollo). */
export const USUARIOS_DEMO: { email: string; password: string; rol: Rol }[] = [
  { email: 'cliente@mundoclima.com', password: 'MundoClima2026*', rol: 'CLIENTE_FINAL' },
  { email: 'tecnico@mundoclima.com', password: 'MundoClima2026*', rol: 'TECNICO' },
  { email: 'distribuidor@mundoclima.com', password: 'MundoClima2026*', rol: 'DISTRIBUIDOR' },
  { email: 'admin@mundoclima.com', password: 'Admin123*', rol: 'ADMIN' },
]
