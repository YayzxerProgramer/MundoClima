import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type {
  Conversion,
  CrearProductoBody,
  EstadoOrden,
  ListaOrdenes,
  Producto,
  RangoVentas,
  ResumenAdmin,
  Usuario,
  UsuarioBody,
  VentasPeriodo,
} from '../types/api'

// Panel de administración: rutas con @Roles(ADMIN) del backend.

export function useResumenAdmin() {
  return useQuery({
    queryKey: ['admin', 'resumen'],
    queryFn: async () => (await api.get<ResumenAdmin>('/estadisticas/resumen')).data,
  })
}

const hoyBogota = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())

/**
 * Las fechas van con la zona de Bogotá para que coincidan con la tienda.
 * El backend solo filtra hoy, semana (7 días) y mes (30 días): con "ano" y "personalizado"
 * devuelve todo el histórico. La serie es diaria, así que el año y el rango se recortan aquí
 * por fecha; si el backend empieza a filtrar, el recorte no cambia el resultado.
 */
export function useVentasPeriodo(rango: RangoVentas, desde: string, hasta: string) {
  const personalizado = rango === 'personalizado'
  const params = personalizado
    ? { rango, desde: `${desde}T00:00:00-05:00`, hasta: `${hasta}T23:59:59.999-05:00` }
    : { rango }
  const [ini, fin] = personalizado ? [desde, hasta] : rango === 'ano' ? [`${hoyBogota().slice(0, 4)}-01-01`, '9999-12-31'] : ['', '9999-12-31']
  return useQuery({
    queryKey: ['admin', 'ventas', params],
    queryFn: async () => (await api.get<VentasPeriodo>('/estadisticas/ventas-periodo', { params })).data,
    select: (v): VentasPeriodo => ({ ...v, serie_tiempo: v.serie_tiempo.filter((d) => d.fecha >= ini && d.fecha <= fin) }),
    enabled: !personalizado || (!!desde && !!hasta && desde <= hasta),
    placeholderData: keepPreviousData,
  })
}

/**
 * GET /estadisticas/resumen devuelve ventas_totales_cop en 0 (la consulta reemplaza el SUM por
 * el COUNT). El total histórico se suma de la serie diaria de ventas aprobadas.
 */
export function useVentasHistoricas() {
  const params = { rango: 'personalizado', desde: '2000-01-01T00:00:00-05:00', hasta: `${hoyBogota()}T23:59:59.999-05:00` }
  return useQuery({
    queryKey: ['admin', 'ventas-historicas', params],
    queryFn: async () => (await api.get<VentasPeriodo>('/estadisticas/ventas-periodo', { params })).data,
    select: (v) => v.serie_tiempo.reduce((a, d) => a + d.total_ventas, 0),
  })
}

export function useAlertasStock() {
  return useQuery({
    queryKey: ['admin', 'alertas-stock'],
    queryFn: async () => (await api.get<Producto[]>('/estadisticas/alertas-stock')).data,
  })
}

export function useConversion() {
  return useQuery({
    queryKey: ['admin', 'conversion'],
    queryFn: async () => (await api.get<Conversion>('/estadisticas/conversion')).data,
  })
}

export interface FiltrosOrdenesAdmin {
  estado?: EstadoOrden
  desde?: string
  hasta?: string
  pagina: number
}

export function useOrdenesAdmin(f: FiltrosOrdenesAdmin) {
  const params = {
    pagina: f.pagina,
    limite: 10,
    ...(f.estado ? { estado: f.estado } : {}),
    ...(f.desde ? { desde: `${f.desde}T00:00:00-05:00` } : {}),
    ...(f.hasta ? { hasta: `${f.hasta}T23:59:59.999-05:00` } : {}),
  }
  return useQuery({
    queryKey: ['admin', 'ordenes', params],
    queryFn: async () => (await api.get<ListaOrdenes>('/ordenes/admin', { params })).data,
    enabled: !(f.desde && f.hasta && f.desde > f.hasta),
    placeholderData: keepPreviousData,
  })
}

export function useUsuarios() {
  return useQuery({
    queryKey: ['admin', 'usuarios'],
    queryFn: async () => (await api.get<Usuario[]>('/usuarios')).data,
  })
}

/**
 * PATCH /usuarios usa PartialType del DTO de creación, que hereda los valores por defecto
 * (rol CLIENTE_FINAL y esta_activo true): por eso siempre se envían rol y esta_activo.
 */
export function useGuardarUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: UsuarioBody }) =>
      (id ? await api.patch<Usuario>(`/usuarios/${id}`, body) : await api.post<Usuario>('/usuarios', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  })
}

export function useEliminarUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.delete<{ mensaje: string }>(`/usuarios/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  })
}

export function useCrearProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CrearProductoBody) => (await api.post<Producto>('/productos', body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['filtros'] })
      qc.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}
