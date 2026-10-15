import { useEffect, useRef } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useOrden } from '../api/cuenta'
import { ModalWompi } from '../components/ModalWompi'
import { Skeleton } from '../components/ui/basicos'
import { Icon } from '../components/ui/Icon'
import { usePagoWompi } from '../hooks/wompi'
import { estadoHttp, mensajeError } from '../lib/api'
import { btn } from '../lib/estilos'
import { fmt, fmtFecha } from '../lib/formato'
import { etiquetaEstado, pasosOrden, puedePagar, textoMetodo } from '../lib/orden'
import NoEncontrado from './NoEncontrado'

const caja = 'flex flex-col gap-1.5 rounded-lg border border-line bg-white p-[18px] text-sm'
const h2 = 'm-0 mb-1 flex items-center gap-2 text-base font-bold'

export default function Pedido() {
  const { id } = useParams()
  const [sp, setSp] = useSearchParams()
  const navigate = useNavigate()
  const consulta = useOrden(id)
  const o = consulta.data
  const wompi = usePagoWompi()
  const abierto = useRef(false)

  // Viene del checkout con ?pagar=1: se abre Wompi una sola vez.
  useEffect(() => {
    if (o && sp.get('pagar') === '1' && !abierto.current) {
      abierto.current = true
      setSp({}, { replace: true })
      if (puedePagar(o)) wompi.pagar(o)
    }
  }, [o, sp, setSp, wompi])

  if (consulta.isError) {
    const st = estadoHttp(consulta.error)
    if (st === 404 || st === 400 || st === 403) return <NoEncontrado />
    return <p className="px-4 pt-16 text-center text-muted">{mensajeError(consulta.error)}</p>
  }
  if (!o) {
    return (
      <div className="mx-auto max-w-[1080px] px-[clamp(16px,4vw,32px)] pt-[18px]">
        <Skeleton className="h-8 w-80" />
        <Skeleton className="mt-6 h-2" />
        <Skeleton className="mt-6 h-64 rounded-lg" />
      </div>
    )
  }

  const [estado, bg, fg] = etiquetaEstado(o)
  const guia = o.coordinadora_numero_guia
  const d = o.direccion_envio

  return (
    <div className="mx-auto max-w-[1080px] px-[clamp(16px,4vw,32px)] pt-[18px]">
      <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-[13px] text-muted-2">
        <Link to="/cuenta/pedidos" className="text-[13px] text-primary-dark">
          Mis pedidos
        </Link>
        <Icon name="chevron-right" size={14} />
        <span aria-current="page" className="tabular text-ink-2">
          {o.referencia}
        </span>
      </nav>
      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <h1 className="tabular m-0 font-display text-[clamp(22px,3vw,30px)] font-bold break-all text-ink">Pedido {o.referencia}</h1>
        <span className="rounded-full px-3 py-1 text-[13px] font-bold" style={{ background: bg, color: fg }}>
          {estado}
        </span>
        <span className="text-sm text-muted-2">{fmtFecha(o.creado_en)}</span>
      </div>
      {puedePagar(o) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-warn-bg px-4 py-3.5 text-warn-ink">
          <span className="flex items-center gap-2.5 font-semibold">
            <Icon name="triangle-alert" size={18} />
            Este pedido está pendiente de pago.
          </span>
          <button type="button" onClick={() => wompi.pagar(o)} className={`${btn.base} ${btn.accent} h-[42px] rounded-[5px] px-[18px]`}>
            Pagar ahora
          </button>
        </div>
      )}
      <div className="mt-[22px] grid grid-cols-4 gap-2">
        {pasosOrden(o).map((p) => (
          <div key={p.label} className="flex flex-col gap-2">
            <span className={`h-1.5 rounded-md ${p.activo ? 'bg-primary' : 'bg-line'}`} />
            <span className={`text-[13px] leading-[1.3] ${p.hecho ? 'text-ink' : 'text-muted-2'} ${p.actual ? 'font-bold' : 'font-medium'}`}>{p.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-start gap-5">
        <section className="flex min-w-0 flex-[3_1_480px] flex-col gap-3 rounded-lg border border-line bg-white p-[18px]">
          <h2 className="m-0 text-base font-bold">Productos</h2>
          {o.items.map((it) => (
            <div key={it.id} className="flex items-center gap-3 text-sm">
              <span className="bg-stripes grid size-12 shrink-0 place-items-center rounded-[5px] text-primary-dark">
                <Icon name="package" size={22} />
              </span>
              <button
                type="button"
                onClick={() => navigate(`/producto/${it.producto_id}`)}
                className="min-w-0 flex-1 text-left text-sm leading-[1.35]"
              >
                {it.nombre_producto}
                <span className="tabular block text-muted-2">
                  {it.cantidad} × {fmt(it.precio_unitario)}
                </span>
              </button>
              <strong className="tabular">{fmt(Number(it.precio_unitario) * it.cantidad)}</strong>
            </div>
          ))}
          <div className="h-px bg-line" />
          <div className="tabular flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{fmt(o.subtotal)}</span>
          </div>
          <div className="tabular flex justify-between text-sm">
            <span>Envío</span>
            <span>{Number(o.costo_envio) > 0 ? fmt(o.costo_envio) : 'Por confirmar'}</span>
          </div>
          <div className="tabular flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{fmt(o.total)}</span>
          </div>
        </section>
        <div className="flex flex-[2_1_300px] flex-col gap-3.5">
          <section className={caja}>
            <h2 className={h2}>
              <Icon name="map-pin" size={18} />
              Dirección de envío
            </h2>
            <span>{`${d.calle}, ${d.ciudad}, ${d.departamento}`}</span>
            <span className="tabular text-muted-2">Tel. {d.telefono_contacto}</span>
          </section>
          <section className={caja}>
            <h2 className={h2}>
              <Icon name="credit-card" size={18} />
              Pago
            </h2>
            <span>{textoMetodo(o)}</span>
          </section>
          <section className={`${caja} gap-2`}>
            <h2 className={h2}>
              <Icon name="truck" size={18} />
              Envío con Coordinadora
            </h2>
            {guia ? (
              <>
                <span>
                  Guía <strong className="tabular">{guia}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => navigate(`/rastreo/${guia}`)}
                  className="h-10 self-start rounded-[5px] border border-primary bg-white px-3.5 font-display font-bold tracking-[0.04em] text-primary uppercase"
                >
                  Rastrear envío
                </button>
              </>
            ) : (
              <span className="text-muted">La guía aparecerá aquí cuando despachemos tu pedido.</span>
            )}
          </section>
        </div>
      </div>
      <ModalWompi estado={wompi.estado} onCerrar={wompi.cerrar} />
    </div>
  )
}
