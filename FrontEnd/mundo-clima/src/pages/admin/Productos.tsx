import { useState } from 'react'
import { Link } from 'react-router'
import { useProductos } from '../../api/catalogo'
import { CabeceraAdmin } from '../../components/layout/AdminLayout'
import { AlertaError, FotoProducto, Skeleton } from '../../components/ui/basicos'
import { Icon } from '../../components/ui/Icon'
import { Paginacion } from '../../components/ui/Paginacion'
import { useDebounce } from '../../hooks/util'
import { mensajeError } from '../../lib/api'
import { iconoCategoria, MOSTRAR_FOTOS } from '../../lib/constantes'
import { btn, input, tarjeta } from '../../lib/estilos'
import { fmt } from '../../lib/formato'
import { estadoStock } from '../../lib/producto'

export default function Productos() {
  const [texto, setTexto] = useState('')
  const [pagina, setPagina] = useState(1)
  const q = useDebounce(texto.trim(), 300)
  const productos = useProductos({ q: q || undefined, pagina, limite: 10, ordenarPor: 'mas_recientes' })
  const lista = productos.data?.datos ?? []

  return (
    <>
      <CabeceraAdmin eyebrow="Catálogo de la tienda" titulo="Productos">
        <Link to="/admin/productos/nuevo" className={`${btn.base} ${btn.primary} h-11 px-5 text-[13px] hover:text-white hover:no-underline`}>
          <Icon name="add" size={20} />
          Nuevo producto
        </Link>
      </CabeceraAdmin>
      <label className="relative block max-w-[460px]">
        <span className="sr-only">Buscar por nombre, SKU o descripción</span>
        <span className="pointer-events-none absolute top-1/2 left-3.5 flex -translate-y-1/2 text-muted">
          <Icon name="search" size={20} />
        </span>
        <input
          type="search"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value)
            setPagina(1)
          }}
          placeholder="Buscar por nombre, SKU o descripción…"
          className={`${input} w-full border-line-strong pl-11`}
        />
      </label>

      <div className="mt-4">
        {productos.isError ? (
          <AlertaError>{mensajeError(productos.error)}</AlertaError>
        ) : productos.isPending ? (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-[76px] rounded-lg" />
            ))}
          </div>
        ) : !lista.length ? (
          <div className="rounded-lg border border-dashed border-line-strong px-5 py-10 text-center text-muted">
            {q ? 'No encontramos productos con esa búsqueda.' : 'Todavía no hay productos activos.'}
          </div>
        ) : (
          <>
            <div className="mb-2.5 text-[13px] text-muted">{productos.data.meta.total} productos activos</div>
            <div className="flex flex-col gap-2.5">
              {lista.map((p) => {
                const st = estadoStock(p)
                return (
                  <div key={p.id} className={`${tarjeta} flex flex-wrap items-center gap-x-5 gap-y-3 p-3`}>
                    <FotoProducto
                      imagen={MOSTRAR_FOTOS ? (p.imagenes?.[0] ?? null) : null}
                      icono={iconoCategoria(p.categoria?.slug)}
                      alt=""
                      iconSize={26}
                      className="size-[52px] shrink-0 rounded-[5px] border border-line"
                    />
                    <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-0.5">
                      <span className="truncate text-sm font-semibold">{p.nombre}</span>
                      <span className="font-mono text-[11.5px] text-muted-2">
                        SKU {p.sku} · {p.categoria?.nombre ?? 'Sin categoría'}
                        {p.marca ? ` · ${p.marca.nombre}` : ''}
                      </span>
                    </div>
                    {p.es_destacado && (
                      <span className="rounded-[3px] bg-tint px-2 py-[3px] text-[11px] font-bold tracking-[0.03em] text-primary uppercase">Destacado</span>
                    )}
                    <span className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap" style={{ color: st.color }}>
                      <Icon name={st.icono} size={17} />
                      {st.agotado ? 'Agotado' : `${p.inventario_stock} en stock`}
                    </span>
                    <strong className="tabular min-w-[110px] text-right font-display font-bold">{fmt(p.precio_base)}</strong>
                    <Link
                      to={`/producto/${p.slug}`}
                      className="flex h-10 items-center gap-1.5 rounded-[5px] border border-line-strong bg-white px-3.5 font-bold text-primary hover:no-underline"
                    >
                      Ver ficha
                      <Icon name="chevron-right" size={16} />
                    </Link>
                  </div>
                )
              })}
            </div>
            <Paginacion
              pagina={pagina}
              total={productos.data.meta.totalPaginas}
              onCambiar={(n) => {
                setPagina(n)
                window.scrollTo({ top: 0 })
              }}
            />
          </>
        )}
      </div>
    </>
  )
}
