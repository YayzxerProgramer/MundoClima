import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { useFiltros, useProductos, type FiltrosCatalogo } from '../api/catalogo'
import { RangoPrecio } from '../components/catalogo/RangoPrecio'
import { TarjetaProducto } from '../components/TarjetaProducto'
import { Migas, Skeleton } from '../components/ui/basicos'
import { Icon } from '../components/ui/Icon'
import { useCategoriasVM } from '../hooks/categorias'
import { useEsEscritorio } from '../hooks/util'
import { CATS_BTU_TIPO, CATS_VOLT_REF, LIMITE_PAGINA } from '../lib/constantes'
import { btn } from '../lib/estilos'
import { fmt, fmtN, plural } from '../lib/formato'
import type { OrdenarPor } from '../types/api'

const ORDENES: [OrdenarPor, string][] = [
  ['destacados', 'Destacados'],
  ['precio_menor', 'Menor precio'],
  ['precio_mayor', 'Mayor precio'],
  ['mas_recientes', 'Más recientes'],
  ['nombre_az', 'Nombre (A–Z)'],
]

const tituloFaceta = 'mb-2.5 font-display text-[13px] font-bold tracking-[0.04em] uppercase'
const checkbox = 'm-0 size-[18px] cursor-pointer accent-primary'

/** Filtros técnicos: el backend acepta un solo valor por filtro, así que se comportan como selección única. */
type ClaveTecnica = 'btu' | 'tipo' | 'volt' | 'ref'

export default function Catalogo() {
  const [sp, setSp] = useSearchParams()
  const esEscritorio = useEsEscritorio()
  const [panelMovil, setPanelMovil] = useState(false)
  const [specAbierto, setSpecAbierto] = useState(false)
  const filtros = useFiltros()
  const { lista: categorias, porSlug } = useCategoriasVM()

  const categoria = sp.get('categoria') || undefined
  const q = sp.get('q') || undefined
  const marcas = sp.get('marca')?.split(',').filter(Boolean) ?? []
  const pmin = sp.get('pmin') ? Number(sp.get('pmin')) : undefined
  const pmax = sp.get('pmax') ? Number(sp.get('pmax')) : undefined
  const soloStock = sp.get('stock') === '1'
  const tecnicos: Record<ClaveTecnica, string | undefined> = {
    btu: sp.get('btu') || undefined,
    tipo: sp.get('tipo') || undefined,
    volt: sp.get('volt') || undefined,
    ref: sp.get('ref') || undefined,
  }
  const orden = (sp.get('orden') as OrdenarPor) || 'destacados'
  const pagina = Math.max(1, Number(sp.get('pagina')) || 1)
  const vista = sp.get('vista') === 'list' ? 'list' : 'grid'

  const consulta: FiltrosCatalogo = {
    q,
    categoria,
    marcas,
    precioMinimo: pmin,
    precioMaximo: pmax,
    btu: tecnicos.btu ? Number(tecnicos.btu) : undefined,
    tipoEquipo: tecnicos.tipo,
    voltaje: tecnicos.volt,
    refrigerante: tecnicos.ref,
    soloConStock: soloStock || undefined,
    ordenarPor: orden,
    pagina,
    limite: LIMITE_PAGINA,
  }
  const productos = useProductos(consulta)
  const datos = productos.data?.datos ?? []
  const total = productos.data?.meta.total ?? 0
  const totalPaginas = productos.data?.meta.totalPaginas ?? 1

  /** Cambia parámetros de la URL; cualquier cambio de filtro vuelve a la página 1. */
  const cambiar = (cambios: Record<string, string | null | undefined>, resetPagina = true) => {
    const n = new URLSearchParams(sp)
    Object.entries(cambios).forEach(([k, v]) => (v == null || v === '' ? n.delete(k) : n.set(k, v)))
    if (resetPagina && !('pagina' in cambios)) n.delete('pagina')
    setSp(n, { replace: false })
  }
  const limpiarTodo = () => {
    const n = new URLSearchParams()
    if (categoria) n.set('categoria', categoria)
    if (orden !== 'destacados') n.set('orden', orden)
    if (vista === 'list') n.set('vista', 'list')
    setSp(n)
  }
  const irPagina = (p: number) => { cambiar({ pagina: p > 1 ? String(p) : null }, false); window.scrollTo({ top: 0 }) }

  const rMin = filtros.data?.rangoPrecio.minimo ?? 0
  const rMax = filtros.data?.rangoPrecio.maximo ?? 0
  const precioActivo = pmin != null || pmax != null
  const cat = porSlug(categoria)

  // Chips de filtros activos
  const chips: { label: string; quitar: () => void }[] = []
  if (q) chips.push({ label: `“${q}”`, quitar: () => cambiar({ q: null }) })
  marcas.forEach((m) =>
    chips.push({
      label: filtros.data?.marcas.find((x) => x.slug === m)?.nombre ?? m,
      quitar: () => cambiar({ marca: marcas.filter((x) => x !== m).join(',') }),
    }),
  )
  if (precioActivo) chips.push({ label: `${fmt(pmin ?? rMin)} – ${fmt(pmax ?? rMax)}`, quitar: () => cambiar({ pmin: null, pmax: null }) })
  if (soloStock) chips.push({ label: 'Solo con stock', quitar: () => cambiar({ stock: null }) })
  if (tecnicos.btu) chips.push({ label: `${fmtN(tecnicos.btu)} BTU`, quitar: () => cambiar({ btu: null }) })
  ;(['tipo', 'volt', 'ref'] as const).forEach((k) => {
    const v = tecnicos[k]
    if (v) chips.push({ label: v, quitar: () => cambiar({ [k]: null }) })
  })
  const activos = chips.filter((c) => !c.label.startsWith('“')).length

  // Grupos de especificaciones según la categoría
  const relA = !categoria || CATS_BTU_TIPO.includes(categoria)
  const relB = !categoria || CATS_VOLT_REF.includes(categoria)
  const grupos: { clave: ClaveTecnica; titulo: string; opciones: { valor: string; label: string }[] }[] = []
  const f = filtros.data
  if (f) {
    if (relA && f.opcionesBtu.length) grupos.push({ clave: 'btu', titulo: 'Capacidad (BTU)', opciones: f.opcionesBtu.map((v) => ({ valor: String(v), label: `${fmtN(v)} BTU` })) })
    if (relA && f.tiposEquipo.length) grupos.push({ clave: 'tipo', titulo: 'Tipo de equipo', opciones: f.tiposEquipo.map((v) => ({ valor: v, label: v })) })
    if (relB && f.voltajes.length) grupos.push({ clave: 'volt', titulo: 'Voltaje', opciones: f.voltajes.map((v) => ({ valor: v, label: v })) })
    if (relB && f.refrigerantes.length) grupos.push({ clave: 'ref', titulo: 'Refrigerante', opciones: f.refrigerantes.map((v) => ({ valor: v, label: v })) })
  }
  const agrupado = !categoria
  const totalGlobal = (f?.categorias ?? []).reduce((a, c) => a + c.conteo, 0)

  const popularCats = [...categorias].sort((a, b) => b.conteo - a.conteo).slice(0, 4)
  const titulo = q && !cat ? `Resultados para “${q}”` : cat ? cat.nombre : 'Todos los productos'
  const desde = (pagina - 1) * LIMITE_PAGINA + 1
  const gridMin = 'grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] md:gap-4'

  const panel: ReactNode = (
    <>
      <div className="flex items-center justify-between gap-2.5 border-b border-line-2 px-4 py-3.5">
        <strong className="font-display text-[15px] font-bold tracking-[0.03em]">FILTROS</strong>
        <span className="flex items-center gap-1.5">
          {activos > 0 && (
            <button type="button" onClick={limpiarTodo} className="text-xs font-semibold text-primary">
              Limpiar todo
            </button>
          )}
          {!esEscritorio && (
            <button type="button" onClick={() => setPanelMovil(false)} aria-label="Cerrar filtros" className="grid size-11 place-items-center rounded-md">
              <Icon name="close" size={22} />
            </button>
          )}
        </span>
      </div>
      <div className={esEscritorio ? 'px-4' : 'flex-1 overflow-auto px-5'}>
        <div className="border-b border-line-2 py-4">
          <div className={tituloFaceta}>Categoría</div>
          <div className="flex flex-col gap-px">
            {[{ slug: undefined as string | undefined, nombre: 'Todas las categorías', icono: 'layout-grid', conteo: totalGlobal }, ...categorias].map((c) => {
              const on = categoria === c.slug
              return (
                <button
                  key={c.slug ?? 'todas'}
                  type="button"
                  aria-pressed={on}
                  onClick={() => cambiar({ categoria: c.slug ?? null, btu: null, tipo: null, volt: null, ref: null })}
                  className={`flex min-h-[34px] w-full items-center gap-[9px] rounded px-2 py-1 text-left text-[13px] hover:bg-line-2 ${on ? 'bg-tint font-bold text-primary-dark' : 'font-medium text-ink-3'}`}
                >
                  <span className="flex text-primary">
                    <Icon name={c.icono} size={18} />
                  </span>
                  <span className="flex-1">{c.nombre}</span>
                  <span className="tabular text-[11.5px] font-normal text-muted-2">({c.conteo})</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="border-b border-line-2 py-4">
          <div className={tituloFaceta}>Marca</div>
          {(f?.marcas ?? []).map((m) => (
            <label key={m.id} htmlFor={`f-marca-${m.slug}`} className="flex min-h-[34px] cursor-pointer items-center gap-[9px] text-[13px]">
              <input
                type="checkbox"
                id={`f-marca-${m.slug}`}
                checked={marcas.includes(m.slug)}
                onChange={() =>
                  cambiar({ marca: (marcas.includes(m.slug) ? marcas.filter((x) => x !== m.slug) : [...marcas, m.slug]).join(',') })
                }
                className={checkbox}
              />
              <span className="flex-1">{m.nombre}</span>
              <span className="tabular text-[11.5px] text-muted-2">({m.conteo})</span>
            </label>
          ))}
        </div>
        {rMax > rMin && (
          <div className="border-b border-line-2 py-4">
            <div className={tituloFaceta}>Rango de precio (COP)</div>
            <RangoPrecio
              key={`${pmin ?? rMin}-${pmax ?? rMax}`}
              min={rMin}
              max={rMax}
              desde={pmin ?? rMin}
              hasta={pmax ?? rMax}
              onCambio={(a, b) => cambiar({ pmin: a > rMin ? String(a) : null, pmax: b < rMax ? String(b) : null })}
            />
          </div>
        )}
        <div className="border-b border-line-2 py-4">
          <button
            type="button"
            role="switch"
            aria-checked={soloStock}
            onClick={() => cambiar({ stock: soloStock ? null : '1' })}
            className="flex w-full items-center justify-between gap-3 text-left font-display text-[13px] font-bold tracking-[0.04em] text-ink"
          >
            SOLO CON STOCK
            <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 ${soloStock ? 'bg-primary' : 'bg-line-strong'}`}>
              <span
                className="absolute top-[3px] left-[3px] size-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(10,25,40,0.3)] transition-transform duration-200"
                style={{ transform: `translateX(${soloStock ? 16 : 0}px)` }}
              />
            </span>
          </button>
        </div>
        {agrupado && grupos.length > 0 && (
          <button
            type="button"
            onClick={() => setSpecAbierto((v) => !v)}
            aria-expanded={specAbierto}
            className="flex w-full items-center justify-between border-b border-line-2 py-4 text-left font-display text-[13px] font-bold tracking-[0.04em] text-ink"
          >
            ESPECIFICACIONES TÉCNICAS
            <span className="flex text-muted-2 transition-transform duration-200" style={{ transform: `rotate(${specAbierto ? 180 : 0}deg)` }}>
              <Icon name="expand_more" size={20} />
            </span>
          </button>
        )}
        {grupos.length > 0 &&
          (!agrupado || specAbierto) &&
          grupos.map((g) => (
            <div key={g.clave} className="border-b border-line-2 py-4">
              <div className={`${tituloFaceta} mb-2`}>{g.titulo}</div>
              {g.opciones.map((o) => {
                const id = `f-${g.clave}-${o.valor.replace(/\W/g, '')}`
                const on = tecnicos[g.clave] === o.valor
                return (
                  <label key={o.valor} htmlFor={id} className="tabular flex min-h-[34px] cursor-pointer items-center gap-[9px] text-[13px]">
                    <input
                      type="checkbox"
                      id={id}
                      checked={on}
                      onChange={() => cambiar({ [g.clave]: on ? null : o.valor })}
                      className={checkbox}
                    />
                    {o.label}
                  </label>
                )
              })}
            </div>
          ))}
        <div className="h-2" />
      </div>
      {!esEscritorio && (
        <div className="flex gap-2.5 border-t border-line px-5 py-3.5">
          <button type="button" onClick={limpiarTodo} className={`${btn.base} ${btn.outline} h-12 flex-1 text-[13px]`}>
            Limpiar
          </button>
          <button type="button" onClick={() => setPanelMovil(false)} className={`${btn.base} ${btn.primary} h-12 flex-[2] text-[13px]`}>
            Ver {total} productos
          </button>
        </div>
      )}
    </>
  )

  return (
    <div className="mx-auto max-w-[1340px] px-[clamp(16px,4vw,32px)] pt-3.5">
      <Migas items={[{ label: 'Inicio', to: '/' }, { label: cat ? cat.nombre : q ? 'Búsqueda' : 'Productos' }]} />
      <div className="mt-3 grid grid-cols-1 items-start gap-5 lg:grid-cols-[264px_minmax(0,1fr)]">
        {esEscritorio ? (
          <aside aria-label="Filtros" className="sticky top-[124px] max-h-[calc(100vh-140px)] overflow-auto rounded-lg border border-line bg-white">
            {panel}
          </aside>
        ) : (
          <>
            <div
              onClick={() => setPanelMovil(false)}
              className={`fixed inset-0 z-70 bg-[rgba(10,25,40,0.45)] transition-opacity duration-250 ${panelMovil ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            />
            <aside
              aria-label="Filtros"
              aria-hidden={!panelMovil}
              inert={!panelMovil}
              className={`fixed top-0 bottom-0 left-0 z-75 flex w-[min(92vw,400px)] flex-col bg-white shadow-[0_0_40px_rgba(10,25,40,0.25)] transition-[transform,visibility] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] ${panelMovil ? 'visible translate-x-0' : 'invisible -translate-x-[105%]'}`}
            >
              {panel}
            </aside>
          </>
        )}

        <div className="min-w-0">
          <div className="mb-3">
            <h1 className="m-0 font-display text-[clamp(22px,2.6vw,27px)] font-bold text-ink">{titulo}</h1>
            <div className="tabular mt-[3px] text-[13px] text-muted">
              {plural(total, 'producto', 'productos')}
              {cat?.descripcion && <span> · {cat.descripcion}</span>}
            </div>
          </div>
          {chips.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted">Filtros activos:</span>
              {chips.map((c) => (
                <span
                  key={c.label}
                  className="tabular flex h-[30px] items-center gap-0.5 rounded-full border border-tint-line bg-tint pr-1 pl-3 text-[12.5px] font-medium text-primary"
                >
                  {c.label}
                  <button
                    type="button"
                    onClick={c.quitar}
                    aria-label={`Quitar filtro ${c.label}`}
                    className="grid size-6 place-items-center rounded-full hover:bg-tint-line"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </span>
              ))}
              <button type="button" onClick={limpiarTodo} className="text-xs font-semibold text-primary underline">
                Limpiar todo
              </button>
            </div>
          )}
          <div className="mb-3.5 flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-md border border-line bg-white px-3 py-2">
            {!esEscritorio && (
              <button
                type="button"
                onClick={() => setPanelMovil(true)}
                className="flex h-[38px] items-center gap-1.5 rounded-[5px] border-[1.5px] border-primary bg-white px-3 font-display text-[13px] font-bold tracking-[0.04em] text-primary"
              >
                <Icon name="tune" size={18} />
                FILTROS
                {activos > 0 && (
                  <span className="h-[19px] min-w-[19px] rounded-full bg-accent px-[5px] text-center text-[11px] leading-[19px] text-accent-ink">{activos}</span>
                )}
              </button>
            )}
            <label htmlFor="mc-orden" className="text-[12.5px] text-muted">
              Ordenar por
            </label>
            <select
              id="mc-orden"
              value={orden}
              onChange={(e) => cambiar({ orden: e.target.value === 'destacados' ? null : e.target.value })}
              className="h-[38px] min-w-[170px] cursor-pointer rounded border border-line bg-white px-2 text-[13px] text-ink"
            >
              {ORDENES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <div className="ml-auto flex items-center gap-2.5">
              <div role="group" aria-label="Tipo de vista" className="flex overflow-hidden rounded border border-line">
                {(['grid', 'list'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => cambiar({ vista: v === 'list' ? 'list' : null }, false)}
                    aria-pressed={vista === v}
                    aria-label={v === 'grid' ? 'Vista en cuadrícula' : 'Vista en lista'}
                    className={`grid h-9 w-10 place-items-center ${v === 'list' ? 'border-l border-line' : ''} ${vista === v ? 'bg-tint text-primary-dark' : 'bg-white text-muted'}`}
                  >
                    <Icon name={v === 'grid' ? 'grid_view' : 'view_list'} size={20} />
                  </button>
                ))}
              </div>
              <span className="tabular hidden text-[12.5px] text-muted lg:inline">
                {total ? `Mostrando ${desde}–${Math.min(total, pagina * LIMITE_PAGINA)} de ${total}` : 'Sin resultados'}
              </span>
            </div>
          </div>

          {productos.isLoading ? (
            <div aria-busy="true" aria-label="Cargando productos" className={`grid ${gridMin}`}>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex flex-col gap-2.5 rounded-lg border border-line-3 bg-white p-3.5">
                  <Skeleton className="aspect-[4/3]" />
                  <Skeleton className="h-2.5 w-2/5" />
                  <Skeleton className="h-3.5" />
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-[22px] w-[55%]" />
                  <Skeleton className="h-11" />
                </div>
              ))}
            </div>
          ) : productos.isError ? (
            <div role="alert" className="flex flex-col items-center gap-2.5 rounded-lg border border-err-line bg-[#FFFAFA] px-7 py-12 text-center">
              <span className="flex text-primary">
                <Icon name="cloud_off" size={52} />
              </span>
              <h2 className="mt-1 mb-0 font-display text-xl font-bold">No pudimos cargar los productos</h2>
              <p className="m-0 max-w-[46ch] text-[13.5px] text-muted">Revisa tu conexión e inténtalo de nuevo. Tus filtros se conservan.</p>
              <button type="button" onClick={() => productos.refetch()} className={`${btn.base} ${btn.primary} mt-2 h-11 px-5 text-[13px]`}>
                <Icon name="refresh" size={18} />
                Reintentar
              </button>
            </div>
          ) : total === 0 ? (
            <div className="flex flex-col items-center gap-2.5 rounded-lg border border-line bg-white px-8 py-14 text-center">
              <span className="flex text-faint">
                <Icon name="search_off" size={56} />
              </span>
              <h2 className="mt-1.5 mb-0 font-display text-xl font-bold">No encontramos productos con esos filtros</h2>
              <p className="m-0 max-w-[46ch] text-[13.5px] text-muted">
                Quita algún filtro o amplía el rango de precio. También puedes empezar por una categoría.
              </p>
              <button type="button" onClick={() => setSp(new URLSearchParams())} className={`${btn.base} ${btn.primary} mt-2 h-11 px-5 text-[13px]`}>
                Quitar todos los filtros
              </button>
              <div className="mt-2.5 flex flex-wrap justify-center gap-2">
                {popularCats.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSp(new URLSearchParams({ categoria: c.slug }))}
                    className="flex h-9 items-center gap-[7px] rounded-full border border-line bg-white px-[13px] text-[12.5px] text-primary hover:border-primary hover:bg-tint"
                  >
                    <Icon name={c.icono} size={17} />
                    {c.nombre}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={`transition-opacity ${productos.isPlaceholderData ? 'opacity-60' : ''}`}>
              {vista === 'grid' ? (
                <div className={`grid ${gridMin}`}>
                  {datos.map((p) => (
                    <TarjetaProducto key={p.id} producto={p} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {datos.map((p) => (
                    <TarjetaProducto key={p.id} producto={p} vista="list" />
                  ))}
                </div>
              )}
            </div>
          )}

          {!productos.isError && totalPaginas > 1 && (
            <nav aria-label="Paginación" className="mt-7 flex justify-center gap-1.5">
              <button
                type="button"
                onClick={() => irPagina(pagina - 1)}
                disabled={pagina <= 1}
                aria-label="Página anterior"
                className="grid size-10 place-items-center rounded border border-line bg-white text-primary disabled:opacity-35"
              >
                <Icon name="chevron_left" size={22} />
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => irPagina(n)}
                  aria-current={n === pagina ? 'page' : undefined}
                  className={`tabular h-10 min-w-10 rounded border font-display text-sm font-bold ${n === pagina ? 'border-primary bg-primary text-white' : 'border-line-strong bg-white text-ink'}`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => irPagina(pagina + 1)}
                disabled={pagina >= totalPaginas}
                aria-label="Página siguiente"
                className="grid size-10 place-items-center rounded border border-line bg-white text-primary disabled:opacity-35"
              >
                <Icon name="chevron_right" size={22} />
              </button>
            </nav>
          )}
        </div>
      </div>
    </div>
  )
}
