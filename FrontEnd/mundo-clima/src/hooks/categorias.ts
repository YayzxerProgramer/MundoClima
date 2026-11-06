import { useCategorias, useFiltros } from '../api/catalogo'
import { iconoCategoria } from '../lib/constantes'

export interface CategoriaVM {
  id: string
  nombre: string
  slug: string
  descripcion: string
  icono: string
  conteo: number
}

/**
 * Categorías raíz de GET /categorias con el conteo de GET /productos/filtros.
 * El conteo de filtros solo trae categorías con productos activos y no suma subcategorías.
 */
export function useCategoriasVM() {
  const cats = useCategorias()
  const filtros = useFiltros()
  const conteo = new Map(filtros.data?.categorias.map((c) => [c.id, c.conteo]))
  const lista: CategoriaVM[] = (cats.data ?? [])
    .filter((c) => c.esta_activo)
    .map((c) => ({
      id: c.id,
      nombre: c.nombre,
      slug: c.slug,
      descripcion: c.descripcion ?? '',
      icono: iconoCategoria(c.slug),
      conteo: conteo.get(c.id) ?? 0,
    }))
  return { lista, cargando: cats.isLoading, porSlug: (slug: string | null | undefined) => lista.find((c) => c.slug === slug) }
}
