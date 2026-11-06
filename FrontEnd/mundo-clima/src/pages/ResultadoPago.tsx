import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { useOrden } from '../api/cuenta'
import { ModalWompi } from '../components/ModalWompi'
import { Spinner } from '../components/ui/basicos'
import { Icon } from '../components/ui/Icon'
import { usePagoWompi } from '../hooks/wompi'
import { estadoHttp, mensajeError } from '../lib/api'
import { btn } from '../lib/estilos'
import { fmt } from '../lib/formato'
import { puedePagar, textoMetodo } from '../lib/orden'
import NoEncontrado from './NoEncontrado'

/** Cuánto esperar el webhook de Wompi antes de mostrar "en proceso". */
const ESPERA_MS = 60_000
const APROBADO = ['PAGADO', 'EN_CAMINO', 'ENTREGADO']

export default function ResultadoPago() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation() as { state: { estadoWidget?: string | null } | null }
  const estadoWidget = state?.estadoWidget ?? null
  const [vencio, setVencio] = useState(false)
  const wompi = usePagoWompi()

  // Polling corto de GET /ordenes/:id hasta que el webhook cambie el estado (no se confía en lo que dice el widget).
  const consulta = useOrden(id, (q) =>
    !vencio && q.state.data?.metodo_pago === 'WOMPI' && q.state.data.estado === 'PENDIENTE_PAGO' ? 3000 : false,
  )
  const o = consulta.data

  useEffect(() => {
    const t = setTimeout(() => setVencio(true), ESPERA_MS)
    return () => clearTimeout(t)
  }, [])

  if (consulta.isError) {
    const st = estadoHttp(consulta.error)
    if (st === 404 || st === 400 || st === 403) return <NoEncontrado />
    return <p className="px-4 pt-16 text-center text-muted">{mensajeError(consulta.error)}</p>
  }

  const cod = o?.metodo_pago === 'CONTRAENTREGA'
  const pendiente = o?.metodo_pago === 'WOMPI' && o.estado === 'PENDIENTE_PAGO'
  const widgetRechazo = !!estadoWidget && ['DECLINED', 'ERROR', 'VOIDED'].includes(estadoWidget)
  const aprobado = !!o && o.metodo_pago === 'WOMPI' && APROBADO.includes(o.estado)
  const rechazado = !!o && o.metodo_pago === 'WOMPI' && (o.estado === 'CANCELADO' || (pendiente && vencio && widgetRechazo))
  const esperando = !o || (pendiente && !vencio)
  const enProceso = pendiente && vencio && !widgetRechazo

  const icono = 'grid size-16 place-items-center rounded-lg'
  const h1 = 'mt-1.5 mb-0 font-display text-[clamp(22px,3vw,28px)] font-bold'
  const p = 'm-0 max-w-[48ch] leading-normal text-muted'

  return (
    <div className="mx-auto max-w-[720px] px-[clamp(16px,4vw,32px)] pt-[clamp(28px,5vw,64px)]">
      <div className="flex flex-col items-center gap-3.5 rounded-lg border border-line bg-white p-[clamp(24px,5vw,44px)] text-center">
        {esperando && (
          <>
            <Spinner size={52} color="#084B75" />
            <h1 className={h1}>Estamos confirmando tu pago</h1>
            <p role="status" className={p}>
              Consultamos el estado del pedido directamente con nuestro sistema, que recibe la confirmación de Wompi. No cierres esta página.
            </p>
          </>
        )}
        {aprobado && (
          <>
            <span className={`${icono} bg-ok-bg text-ok`}>
              <Icon name="circle-check" size={34} />
            </span>
            <h1 className={h1}>¡Pago aprobado!</h1>
            <p className={p}>Tu pedido está confirmado. Te avisaremos por correo cuando Coordinadora lo recoja y tengas número de guía.</p>
          </>
        )}
        {cod && (
          <>
            <span className={`${icono} bg-tint text-primary`}>
              <Icon name="hand-coins" size={34} />
            </span>
            <h1 className={h1}>¡Pedido confirmado!</h1>
            <p className={p}>Pagarás {fmt(o!.total)} al recibir tu pedido. Te avisaremos cuando salga para tu dirección.</p>
          </>
        )}
        {rechazado && (
          <>
            <span className={`${icono} bg-err-bg text-err`}>
              <Icon name="circle-x" size={34} />
            </span>
            <h1 className={h1}>El pago no fue aprobado</h1>
            <p className={p}>
              No se realizó ningún cobro.{' '}
              {o!.estado === 'CANCELADO' ? 'El pedido quedó cancelado; puedes volver a hacerlo desde el catálogo.' : 'Puedes intentarlo de nuevo con otra tarjeta, PSE o Nequi.'}
            </p>
            {puedePagar(o!) && (
              <button type="button" onClick={() => wompi.pagar(o!)} className={`${btn.base} ${btn.accent} h-[50px] px-[22px] text-base`}>
                Reintentar pago
              </button>
            )}
          </>
        )}
        {enProceso && (
          <>
            <span className={`${icono} bg-warn-bg text-warn`}>
              <Icon name="schedule" size={34} />
            </span>
            <h1 className={h1}>Tu pago está en proceso</h1>
            <p className={p}>
              Aún no recibimos la confirmación de Wompi. Si ya pagaste, el pedido se actualizará solo en unos minutos. Si no alcanzaste a pagar, puedes hacerlo ahora.
            </p>
            <button type="button" onClick={() => wompi.pagar(o!)} className={`${btn.base} ${btn.accent} h-[50px] px-[22px] text-base`}>
              Pagar ahora
            </button>
          </>
        )}
        {o && (
          <div className="mt-2.5 grid w-full grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 rounded-lg bg-soft px-[18px] py-4 text-left text-sm">
            <span>
              <span className="block text-xs font-semibold text-muted-2">Referencia</span>
              <strong className="tabular break-all">{o.referencia}</strong>
            </span>
            <span>
              <span className="block text-xs font-semibold text-muted-2">Total</span>
              <strong className="tabular">{fmt(o.total)}</strong>
            </span>
            <span>
              <span className="block text-xs font-semibold text-muted-2">Método</span>
              <strong>{textoMetodo(o)}</strong>
            </span>
            <span>
              <span className="block text-xs font-semibold text-muted-2">Envío a</span>
              <strong>{o.direccion_envio.ciudad}</strong>
            </span>
          </div>
        )}
        <div className="mt-1.5 flex flex-wrap justify-center gap-2.5">
          <button type="button" onClick={() => navigate(`/pedidos/${id}`)} className={`${btn.base} ${btn.primary} h-12 px-5`}>
            Ver mi pedido
          </button>
          <Link to="/productos" className={`${btn.ghost} flex h-12 items-center rounded-md px-5 hover:no-underline`}>
            Seguir comprando
          </Link>
        </div>
      </div>
      <ModalWompi estado={wompi.estado} onCerrar={wompi.cerrar} />
    </div>
  )
}
