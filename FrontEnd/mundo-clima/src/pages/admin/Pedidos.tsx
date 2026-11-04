import { Link, useSearchParams } from 'react-router'
import { useOrdenesAdmin } from '../../api/admin'
import { CabeceraAdmin } from '../../components/layout/AdminLayout'
import { AlertaError, Skeleton } from '../../components/ui/basicos'
import { Icon } from '../../components/ui/Icon'
import { Paginacion } from '../../components/ui/Paginacion'
import { mensajeError } from '../../lib/api'
import { ESTADO_ORDEN } from '../../lib/constantes'
import { input, tarjeta } from '../../lib/estilos'
import { fmt, fmtFecha } from '../../lib/formato'
import { etiquetaEstado, textoMetodo } from '../../lib/orden'
import type { EstadoOrden } from '../../types/api'

const etiqueta = 'flex flex-col gap-1.5 text-sm font-semibold'

export default function Pedidos() {
  const [sp, setSp] = useSearchParams()
  const estado = (sp.get('estado') ?? '') as EstadoOrden | ''
  const desde = sp.get('desde') ?? ''
  const hasta = sp.get('hasta') ?? ''
  const pagina = Math.max(1, Number(sp.get('pagina')) || 1)
  const fechasInvalidas = !!(desde && hasta && desde > hasta)
  const ordenes = useOrdenesAdmin({ estado: estado || undefined, desde, hasta, pagina })
  const lista = ordenes.data?.datos ?? []

  const cambiar = (clave: string, valor: string) => {
    const n = new URLSearchParams(sp)
    if (valor) n.set(clave, valor)
    else n.delete(clave)
    if (clave !== 'pagina') n.delete('pagina')
    setSp(n)
  }

  return (
    <>
      <CabeceraAdmin eyebrow="Operación de la tienda" titulo="Pedidos" />
      <div className={`${tarjeta} grid gap-3 p-4 sm:grid-cols-3`}>
        <label className={etiqueta}>
          Estado
          <select value={estado} onChange={(e) => cambiar('estado', e.target.value)} className={`${input} border-line-strong`}>
            <option value="">Todos los estados</option>
            {(Object.keys(ESTADO_ORDEN) as EstadoOrden[]).map((e) => (
              <option key={e} value={e}>
                {ESTADO_ORDEN[e][0]}
              </option>
            ))}
          </select>
        </label>
        <label className={etiqueta}>
          Desde
          <input type="date" value={desde} max={hasta || undefined} onChange={(e) => cambiar('desde', e.target.value)} className={`${input} border-line-strong`} />
        </label>
        <label className={etiqueta}>
          Hasta
          <input type="date" value={hasta} min={desde || undefined} onChange={(e) => cambiar('hasta', e.target.value)} className={`${input} border-line-strong`} />
        </label>
      </div>

      <div className="mt-4">
        {fechasInvalidas ? (
          <AlertaError>La fecha final debe ser igual o posterior a la inicial.</AlertaError>
        ) : ordenes.isError ? (
          <AlertaError>{mensajeError(ordenes.error)}</AlertaError>
        ) : ordenes.isPending ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[74px] rounded-lg" />
            ))}
          </div>
        ) : !lista.length ? (
          <div className="rounded-lg border border-dashed border-line-strong px-5 py-10 text-center text-muted">
            No hay pedidos con estos filtros.
          </div>
        ) : (
          <>
            <div className="mb-2.5 text-[13px] text-muted">{ordenes.data.meta.total} pedidos</div>
            <div className="flex flex-col gap-2.5">
              {lista.map((o) => {
                const [label, bg, fg] = etiquetaEstado(o)
                return (
                  <div key={o.id} className={`${tarjeta} flex flex-wrap items-center gap-x-6 gap-y-3 px-[18px] py-3.5`}>
                    <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5">
                      <strong className="tabular text-sm break-all">{o.referencia}</strong>
                      <span className="text-[13px] text-muted-2">
                        {fmtFecha(o.creado_en)} · {textoMetodo(o)}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5 text-sm">
                      <span className="truncate font-semibold">{o.usuario?.nombre_completo ?? 'Cliente'}</span>
                      <span className="truncate text-[13px] text-muted-2">{o.usuario?.email}</span>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap" style={{ background: bg, color: fg }}>
                      {label}
                    </span>
                    <strong className="tabular min-w-[110px] text-right font-display font-bold">{fmt(o.total)}</strong>
                    <Link
                      to={`/pedidos/${o.id}`}
                      className="flex h-10 items-center gap-1.5 rounded-[5px] border border-line-strong bg-white px-3.5 font-bold text-primary hover:no-underline"
                    >
                      Ver detalle
                      <Icon name="chevron-right" size={16} />
                    </Link>
                  </div>
                )
              })}
            </div>
            <Paginacion
              pagina={ordenes.data.meta.pagina}
              total={ordenes.data.meta.totalPaginas}
              onCambiar={(p) => {
                cambiar('pagina', p > 1 ? String(p) : '')
                window.scrollTo({ top: 0 })
              }}
            />
          </>
        )}
      </div>
    </>
  )
}
