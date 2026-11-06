import { useState } from 'react'
import { Link } from 'react-router'
import { useAlertasStock, useConversion, useResumenAdmin, useVentasHistoricas, useVentasPeriodo } from '../../api/admin'
import { CabeceraAdmin } from '../../components/layout/AdminLayout'
import { AlertaError, Skeleton } from '../../components/ui/basicos'
import { Icon } from '../../components/ui/Icon'
import { mensajeError } from '../../lib/api'
import { ESTADO_ORDEN } from '../../lib/constantes'
import { input, tarjeta } from '../../lib/estilos'
import { fmt, fmtN, plural } from '../../lib/formato'
import type { EstadoOrden, RangoVentas } from '../../types/api'

const RANGOS: [RangoVentas, string][] = [
  ['hoy', 'Hoy'],
  ['semana', 'Últimos 7 días'],
  ['mes', 'Últimos 30 días'],
  ['ano', 'Este año'],
  ['personalizado', 'Personalizado'],
]

const fechaCorta = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'America/Bogota' })
const dia = (f: string) => fechaCorta.format(new Date(`${f}T12:00:00-05:00`))
const seccion = `${tarjeta} p-[clamp(16px,2.5vw,24px)]`
const h2 = 'm-0 font-display text-lg font-bold'

function Metrica({ icono, label, valor, detalle }: { icono: string; label: string; valor: string; detalle?: string }) {
  return (
    <div className={`${tarjeta} flex flex-col gap-1.5 p-[18px]`}>
      <div className="flex items-center justify-between gap-2 text-[13px] font-semibold text-muted">
        {label}
        <span className="grid size-9 place-items-center rounded-md bg-tint text-primary">
          <Icon name={icono} size={20} />
        </span>
      </div>
      <strong className="tabular font-display text-[clamp(20px,2.4vw,26px)] font-bold text-ink">{valor}</strong>
      {detalle && <span className="text-[12.5px] text-muted-2">{detalle}</span>}
    </div>
  )
}

function GraficaVentas() {
  const [rango, setRango] = useState<RangoVentas>('mes')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const ventas = useVentasPeriodo(rango, desde, hasta)
  const serie = ventas.data?.serie_tiempo ?? []
  const max = Math.max(1, ...serie.map((v) => v.total_ventas))
  const invalido = rango === 'personalizado' && !(desde && hasta && desde <= hasta)
  const paso = Math.max(1, Math.ceil(serie.length / 8))

  return (
    <section className={seccion}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={h2}>Ventas por período</h2>
          {!invalido && ventas.data && (
            <span className="tabular text-[13px] text-muted">
              {fmt(serie.reduce((a, v) => a + v.total_ventas, 0))} en {plural(serie.reduce((a, v) => a + v.ordenes, 0), 'pedido aprobado', 'pedidos aprobados')}
            </span>
          )}
        </div>
        <select
          aria-label="Período de ventas"
          value={rango}
          onChange={(e) => setRango(e.target.value as RangoVentas)}
          className={`${input} h-11 border-line-strong text-sm`}
        >
          {RANGOS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      {rango === 'personalizado' && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Desde
            <input type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} className={`${input} border-line-strong`} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Hasta
            <input type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} className={`${input} border-line-strong`} />
          </label>
        </div>
      )}
      <div className="mt-5">
        {invalido ? (
          <p className="m-0 text-sm text-muted">Elige una fecha inicial y una final para ver las ventas.</p>
        ) : ventas.isError ? (
          <AlertaError>{mensajeError(ventas.error)}</AlertaError>
        ) : ventas.isPending ? (
          <Skeleton className="h-[220px] rounded-lg" />
        ) : !serie.length ? (
          <div className="grid h-[180px] place-items-center rounded-lg border border-dashed border-line-strong text-sm text-muted">
            Sin ventas aprobadas en este período.
          </div>
        ) : (
          <>
            <svg viewBox="0 0 720 220" role="img" aria-label="Gráfica de ventas por día" className="block h-auto w-full">
              <line x1="0" x2="720" y1="190" y2="190" stroke="#DCE3EA" />
              {serie.map((v, i) => {
                const ancho = 700 / serie.length
                const alto = (v.total_ventas / max) * 165
                return (
                  <g key={v.fecha}>
                    <rect x={i * ancho + 10} y={190 - alto} width={Math.max(3, Math.min(56, ancho - 8))} height={Math.max(1, alto)} rx="3" fill="#0A598A">
                      <title>{`${dia(v.fecha)}: ${fmt(v.total_ventas)} · ${v.ordenes} pedidos`}</title>
                    </rect>
                    {i % paso === 0 && (
                      <text x={i * ancho + 10} y="210" fontSize="11" fill="#5E6F81">
                        {dia(v.fecha)}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
            <details className="mt-3">
              <summary className="cursor-pointer text-[13px] font-semibold text-primary-dark">Ver los datos de la gráfica</summary>
              <div className="mt-3 overflow-x-auto rounded-md border border-line">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-soft text-xs text-muted">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">Fecha</th>
                      <th className="px-3 py-2.5 font-semibold">Ventas</th>
                      <th className="px-3 py-2.5 font-semibold">Pedidos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serie.map((v) => (
                      <tr key={v.fecha} className="border-t border-line-2">
                        <td className="px-3 py-2.5">{dia(v.fecha)}</td>
                        <td className="tabular px-3 py-2.5">{fmt(v.total_ventas)}</td>
                        <td className="tabular px-3 py-2.5">{v.ordenes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </div>
    </section>
  )
}

export default function Resumen() {
  const resumen = useResumenAdmin()
  const alertas = useAlertasStock()
  const conversion = useConversion()
  const historico = useVentasHistoricas()
  const r = resumen.data
  const ventas = historico.data ?? 0
  const aprobados = r?.ordenes_aprobadas_conteo ?? 0

  return (
    <>
      <CabeceraAdmin eyebrow="Tu tienda en perspectiva" titulo="Resumen general" />
      {resumen.isError ? (
        <AlertaError>{mensajeError(resumen.error)}</AlertaError>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-3.5">
          {!r || historico.isPending ? (
            Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[118px] rounded-lg" />)
          ) : (
            <>
              <Metrica
                icono="payments"
                label="Ventas aprobadas"
                valor={historico.isError ? '—' : fmt(ventas)}
                detalle={historico.isError ? 'No pudimos calcular las ventas' : `Ticket promedio ${fmt(aprobados ? Math.round(ventas / aprobados) : 0)}`}
              />
              <Metrica icono="receipt_long" label="Pedidos" valor={fmtN(r.ordenes_totales)} detalle={plural(aprobados, 'aprobado', 'aprobados')} />
              <Metrica
                icono="inventory_2"
                label="Productos activos"
                valor={fmtN(r.inventario.productos_activos)}
                detalle={`Inventario ${fmt(r.inventario.valor_total_inventario_cop)}`}
              />
              <Metrica
                icono="group"
                label="Clientes"
                valor={fmtN(r.clientes.total_registrados)}
                detalle={`${plural(r.clientes.tecnicos_profesionales, 'técnico', 'técnicos')} · ${plural(r.clientes.distribuidores_mayoristas, 'distribuidor', 'distribuidores')}`}
              />
            </>
          )}
        </div>
      )}

      <div className="mt-5">
        <GraficaVentas />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className={seccion}>
          <h2 className={`${h2} mb-3.5 flex items-center gap-2`}>
            <span className="flex text-warn">
              <Icon name="warning" size={22} />
            </span>
            Productos con stock bajo
          </h2>
          {alertas.isError ? (
            <AlertaError>{mensajeError(alertas.error)}</AlertaError>
          ) : alertas.isPending ? (
            <Skeleton className="h-36 rounded-lg" />
          ) : !alertas.data.length ? (
            <p className="m-0 text-sm text-muted">Todo el inventario está por encima del mínimo.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {alertas.data.map((p) => (
                <li key={p.id} className="flex items-center gap-3 border-t border-line-2 py-3 first:border-t-0 first:pt-0">
                  <div className="min-w-0 flex-1">
                    <Link to={`/producto/${p.slug}`} className="block truncate text-sm font-semibold text-ink hover:text-primary">
                      {p.nombre}
                    </Link>
                    <span className="font-mono text-[11.5px] text-muted-2">SKU {p.sku}</span>
                  </div>
                  <span className="tabular rounded-full bg-warn-bg px-2.5 py-1 text-xs font-bold whitespace-nowrap text-warn-ink">
                    {p.inventario_stock} / mín. {p.alerta_stock_minimo}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-5">
          <section className={seccion}>
            <h2 className={`${h2} mb-3`}>Conversión</h2>
            {conversion.isError ? (
              <AlertaError>{mensajeError(conversion.error)}</AlertaError>
            ) : conversion.isPending ? (
              <Skeleton className="h-28 rounded-lg" />
            ) : (
              <>
                <strong className="tabular font-display text-4xl font-bold text-primary">{conversion.data.tasa_conversion_porcentaje}%</strong>
                <dl className="m-0 mt-4 flex flex-col gap-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Visitas registradas</dt>
                    <dd className="tabular m-0 font-bold">{fmtN(conversion.data.total_visitas_registradas)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Pedidos completados</dt>
                    <dd className="tabular m-0 font-bold">{fmtN(conversion.data.ordenes_completadas)}</dd>
                  </div>
                </dl>
              </>
            )}
          </section>
          {r && (
            <section className={seccion}>
              <h2 className={`${h2} mb-3`}>Pedidos por estado</h2>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {(Object.keys(ESTADO_ORDEN) as EstadoOrden[]).map((e) => {
                  const [label, bg, fg] = ESTADO_ORDEN[e]
                  return (
                    <li key={e}>
                      <Link
                        to={`/admin/pedidos?estado=${e}`}
                        className="flex items-center justify-between gap-3 rounded-md px-1.5 py-1.5 text-sm hover:bg-soft hover:no-underline"
                      >
                        <span className="rounded-full px-2.5 py-[3px] text-xs font-bold" style={{ background: bg, color: fg }}>
                          {label}
                        </span>
                        <strong className="tabular text-ink">{fmtN(r.ordenes_por_estado[e] ?? 0)}</strong>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
