import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { nivelDeRol } from '../lib/constantes'
import { useAuth } from '../store/auth'
import type { Categoria, ListaProductos, Marca, OpcionesFiltros, OrdenarPor, Producto, Rol } from '../types/api'

export interface FiltrosCatalogo {
  q?: string
  categoria?: string
  marcas?: string[]
  precioMinimo?: number
  precioMaximo?: number
  btu?: number
  refrigerante?: string
  voltaje?: string
  tipoEquipo?: string
  soloConStock?: boolean
  ordenarPor?: OrdenarPor
  pagina?: number
  limite?: number
}

/** Nivel de precio de la sesión actual. Va en las query keys: al cambiar de sesión cambian los precios. */
export const useNivel = () => nivelDeRol(useAuth((s) => s.usuario?.rol))

function paramsProductos(f: FiltrosCatalogo, nivel: string, marcaIds: string[]) {
  const p: Record<string, string | number | boolean> = {}
  if (f.q) p.q = f.q
  if (marcaIds.length) p.marca = marcaIds.join(',')
  if (f.precioMinimo != null) p.precioMinimo = f.precioMinimo
  if (f.precioMaximo != null) p.precioMaximo = f.precioMaximo
  if (f.btu != null) p.btu = f.btu
  if (f.refrigerante) p.refrigerante = f.refrigerante
  if (f.voltaje) p.voltaje = f.voltaje
  if (f.tipoEquipo) p.tipoEquipo = f.tipoEquipo
  if (f.soloConStock) p.soloConStock = true
  if (f.ordenarPor) p.ordenarPor = f.ordenarPor
  if (f.pagina) p.pagina = f.pagina
  if (f.limite) p.limite = f.limite
  // El DTO de GET /productos trae nivelCliente = CLIENTE_FINAL por defecto, así que el
  // backend nunca usa el rol del JWT en el listado. Se envía el nivel de la sesión explícitamente.
  if (nivel !== 'CLIENTE_FINAL') p.nivelCliente = nivel
  return p
}

/** Tope del DTO de GET /productos (@Max(100)). */
const LIMITE_MAXIMO = 100

/**
 * Workarounds de dos fallas del backend en GET /productos (no se tocó el backend):
 * - `marca` con slug responde 500 (compara uuid = text). Con ids funciona, así que se envían ids.
 * - `categoria` responde 500 con slug y con id (mismo error). Se piden hasta 100 productos con el
 *   resto de filtros y se filtra la categoría (y sus subcategorías) aquí, paginando en el cliente.
 *   Quitar este bloque cuando el backend compare categoria.id::text.
 */
export function useProductos(f: FiltrosCatalogo, opciones: { enabled?: boolean } = {}) {
  const nivel = useNivel()
  const marcas = useMarcas()
  const categorias = useCategorias()
  const necesitaMarcas = !!f.marcas?.length
  const necesitaCats = !!f.categoria
  const listo = (!necesitaMarcas || !!marcas.data) && (!necesitaCats || !!categorias.data)
  return useQuery({
    queryKey: ['productos', nivel, f],
    queryFn: async () => {
      const marcaIds = (f.marcas ?? []).map((sl) => marcas.data?.find((m) => m.slug === sl)?.id).filter(Boolean) as string[]
      if (necesitaMarcas && !marcaIds.length) return listaVacia(f, nivel)
      if (!f.categoria) {
        return (await api.get<ListaProductos>('/productos', { params: paramsProductos(f, nivel, marcaIds) })).data
      }
      const planas = (categorias.data ?? []).flatMap((c) => [c, ...(c.hijos ?? []).flatMap((h) => [h, ...(h.hijos ?? [])])])
      const cat = planas.find((c) => c.slug === f.categoria || c.id === f.categoria)
      if (!cat) return listaVacia(f, nivel)
      const todo = (
        await api.get<ListaProductos>('/productos', {
          params: paramsProductos({ ...f, pagina: 1, limite: LIMITE_MAXIMO }, nivel, marcaIds),
        })
      ).data
      const datos = todo.datos.filter((p) => p.categoria?.id === cat.id || p.categoria?.categoria_padre_id === cat.id)
      const limite = f.limite ?? 12
      const pagina = f.pagina ?? 1
      return {
        datos: datos.slice((pagina - 1) * limite, pagina * limite),
        meta: { total: datos.length, pagina, limite, totalPaginas: Math.max(1, Math.ceil(datos.length / limite)), nivelCliente: todo.meta.nivelCliente },
      }
    },
    placeholderData: keepPreviousData,
    enabled: (opciones.enabled ?? true) && listo,
  })
}

function listaVacia(f: FiltrosCatalogo, nivel: string): ListaProductos {
  return { datos: [], meta: { total: 0, pagina: f.pagina ?? 1, limite: f.limite ?? 12, totalPaginas: 1, nivelCliente: nivel as Rol } }
}

/** Acepta slug o id. */
export function useProducto(identificador: string | undefined) {
  const nivel = useNivel()
  return useQuery({
    queryKey: ['producto', nivel, identificador],
    queryFn: async () => (await api.get<Producto>(`/productos/${encodeURIComponent(identificador!)}`)).data,
    enabled: !!identificador,
    retry: (n, e) => (e as { response?: { status?: number } }).response?.status !== 404 && n < 2,
  })
}

export function useFiltros() {
  return useQuery({
    queryKey: ['filtros'],
    queryFn: async () => (await api.get<OpcionesFiltros>('/productos/filtros')).data,
    staleTime: 5 * 60_000,
  })
}

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: async () => (await api.get<Categoria[]>('/categorias')).data,
    staleTime: 10 * 60_000,
  })
}

export function useMarcas() {
  return useQuery({
    queryKey: ['marcas'],
    queryFn: async () => (await api.get<Marca[]>('/marcas')).data,
    staleTime: 10 * 60_000,
  })
}

/** Destacados de una categoría para el menú: se pide al abrirla y queda en caché. */
export function useDestacadosCategoria(slug: string | undefined, enabled: boolean) {
  return useProductos({ categoria: slug, ordenarPor: 'destacados', limite: 4 }, { enabled: enabled && !!slug })
}
