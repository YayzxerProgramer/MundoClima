import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useNivel } from '../api/catalogo'
import { useCotizarEnvio, useCrearOrden } from '../api/cuenta'
import { AlertaError, Spinner } from '../components/ui/basicos'
import { Campo } from '../components/ui/Campo'
import { Icon } from '../components/ui/Icon'
import { useResumenCarrito, useSincronizarCarrito } from '../hooks/carrito'
import { mensajeError } from '../lib/api'
import { DEPARTAMENTOS, ETIQUETA_PRECIO, iconoCategoria } from '../lib/constantes'
import { input } from '../lib/estilos'
import { fmt, plural } from '../lib/formato'
import { useAuth } from '../store/auth'
import { useCarrito } from '../store/carrito'
import type { MetodoPago } from '../types/api'

interface Direccion {
  calle: string
  ciudad: string
  dep: string
  tel: string
}
type Errores = Partial<Record<keyof Direccion, string>>

const METODOS: [MetodoPago, string, string, string][] = [
  ['WOMPI', 'Pagar en línea', 'Tarjeta, PSE o Nequi a través de Wompi', 'credit-card'],
  ['CONTRAENTREGA', 'Contraentrega', 'Pagas cuando recibes tu pedido', 'hand-coins'],
]
const CELULAR = /^(\+?57)?\s?3\d{2}\s?\d{3}\s?\d{4}$/

export default function Checkout() {
  useSincronizarCarrito()
  const navigate = useNavigate()
  const usuario = useAuth((s) => s.usuario)
  const nivel = useNivel()
  const { lineas, subtotal, ahorro, pesoKg, unidades } = useResumenCarrito()
  const [dir, setDir] = useState<Direccion>({ calle: '', ciudad: '', dep: '', tel: usuario?.telefono ?? '' })
  const [err, setErr] = useState<Errores>({})
  const [intentado, setIntentado] = useState(false)
  const [metodo, setMetodo] = useState<MetodoPago>('WOMPI')
  const cotizar = useCotizarEnvio()
  const crear = useCrearOrden()
  const [creada, setCreada] = useState(false)

  // Al crear la orden se vacía el carrito: no redirigir al carrito en ese momento.
  if (!lineas.length && !creada) return <Navigate to="/carrito" replace />

  const set = (k: keyof Direccion, v: string) => {
    setDir((d) => ({ ...d, [k]: v }))
    setErr((e) => ({ ...e, [k]: undefined }))
    if (k === 'dep' || k === 'ciudad') cotizar.reset()
  }

  const calcularEnvio = () => {
    const e: Errores = {}
    if (dir.ciudad.trim().length < 2) e.ciudad = 'Escribe la ciudad o municipio'
    if (!dir.dep) e.dep = 'Selecciona el departamento'
    if (Object.keys(e).length) { setErr((x) => ({ ...x, ...e })); return }
    cotizar.mutate({
      departamento_destino: dir.dep,
      ciudad_destino: dir.ciudad.trim(),
      peso_total_kg: Math.max(0.1, pesoKg),
      valor_declarado: subtotal,
    })
  }

  const confirmar = () => {
    const e: Errores = {}
    if (dir.calle.trim().length < 5) e.calle = 'Escribe la dirección completa'
    if (dir.ciudad.trim().length < 2) e.ciudad = 'Escribe la ciudad o municipio'
    if (!dir.dep) e.dep = 'Selecciona el departamento'
    if (!CELULAR.test(dir.tel.trim())) e.tel = 'Escribe un celular válido, ej. 300 123 4567'
    setErr(e)
    setIntentado(true)
    if (Object.keys(e).length) return
    crear.mutate(
      {
        items: lineas.map((l) => ({ producto_id: l.item.producto_id, cantidad: l.item.cantidad })),
        metodo_pago: metodo,
        direccion_envio: { calle: dir.calle.trim(), ciudad: dir.ciudad.trim(), departamento: dir.dep, telefono_contacto: dir.tel.trim() },
      },
      {
        onSuccess: (orden) => {
          setCreada(true)
          useCarrito.getState().vaciar()
          // Con Wompi el pago se abre desde el detalle del pedido: si el cliente cierra el widget, ahí queda el botón "Pagar ahora".
          navigate(metodo === 'WOMPI' ? `/pedidos/${orden.id}?pagar=1` : `/pedidos/${orden.id}/resultado`, { replace: true })
        },
      },
    )
  }

  const envio = cotizar.data?.total_flete
  const hayErrores = intentado && Object.values(err).some(Boolean)
  const seccion = 'flex flex-col gap-4 rounded-lg border border-line bg-white p-[clamp(18px,3vw,26px)]'
  const paso = 'grid size-7 place-items-center rounded-full bg-primary text-sm text-white'

  return (
    <div className="mx-auto max-w-[1340px] px-[clamp(16px,4vw,32px)] pt-[18px]">
      <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-[13px] text-muted-2">
        <Link to="/carrito" className="text-[13px] text-primary-dark">
          Carrito
        </Link>
        <Icon name="chevron-right" size={14} />
        <span aria-current="page" className="text-ink-2">
          Pago
        </span>
      </nav>
      <div className="mt-3.5 flex flex-wrap items-baseline justify-between gap-2.5">
        <h1 className="m-0 font-display text-[clamp(24px,3vw,34px)] font-bold text-ink">Finaliza tu compra</h1>
        <span className="text-sm text-muted">
          Comprando como <strong className="text-ink">{usuario?.nombre_completo}</strong> · {usuario?.email}
        </span>
      </div>
      <div className="mt-[22px] flex flex-wrap items-start gap-7">
        <div className="flex min-w-0 flex-[3_1_520px] flex-col gap-4">
          <section className={seccion}>
            <h2 className="m-0 flex items-center gap-2.5 font-display text-[19px] font-bold">
              <span className={paso}>1</span>
              Dirección de envío
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3.5">
              <Campo
                label="Dirección"
                completo
                placeholder="Calle, número, barrio, apto"
                autoComplete="street-address"
                value={dir.calle}
                error={err.calle}
                onChange={(e) => set('calle', e.target.value)}
              />
              <Campo
                label="Ciudad o municipio"
                placeholder="Ej. Medellín"
                autoComplete="address-level2"
                value={dir.ciudad}
                error={err.ciudad}
                onChange={(e) => set('ciudad', e.target.value)}
              />
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                <span>Departamento</span>
                <select
                  value={dir.dep}
                  onChange={(e) => set('dep', e.target.value)}
                  aria-invalid={!!err.dep}
                  className={`${input} px-3 ${err.dep ? 'border-primary' : 'border-line-strong'}`}
                >
                  <option value="">Selecciona</option>
                  {DEPARTAMENTOS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
                {err.dep && (
                  <span role="alert" className="flex items-center gap-1.5 text-[13px] font-medium text-err">
                    <Icon name="circle-alert" size={14} />
                    {err.dep}
                  </span>
                )}
              </label>
              <Campo
                label="Celular de contacto"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="300 123 4567"
                value={dir.tel}
                error={err.tel}
                onChange={(e) => set('tel', e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={calcularEnvio}
                disabled={cotizar.isPending}
                className="flex h-[42px] items-center gap-2 rounded-[5px] border border-primary bg-white px-4 font-display font-bold tracking-[0.04em] text-primary uppercase disabled:opacity-50"
              >
                <Icon name="truck" size={18} />
                {cotizar.isPending ? 'Cotizando…' : cotizar.data ? 'Recalcular envío' : 'Calcular envío'}
              </button>
              {cotizar.data && (
                <span role="status" className="flex items-center gap-2 text-sm font-semibold text-ok-ink">
                  <Icon name="circle-check" size={18} />
                  Coordinadora: {fmt(cotizar.data.total_flete)} · {plural(cotizar.data.dias_entrega_estimados, 'día hábil', 'días hábiles')}
                </span>
              )}
              {cotizar.isError && <span className="text-sm text-err">{mensajeError(cotizar.error)}</span>}
            </div>
          </section>
          <section className={seccion}>
            <h2 className="m-0 flex items-center gap-2.5 font-display text-[19px] font-bold">
              <span className={paso}>2</span>
              Método de pago
            </h2>
            <div role="radiogroup" aria-label="Método de pago" className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-2.5">
              {METODOS.map(([k, label, desc, icono]) => {
                const on = metodo === k
                return (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setMetodo(k)}
                    className={`flex items-start gap-3.5 rounded-md border-2 p-4 text-left ${on ? 'border-primary bg-select' : 'border-line bg-white'}`}
                  >
                    <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-primary' : 'border-line-strong'}`}>
                      <span className={`size-2.5 rounded-full ${on ? 'bg-primary' : 'bg-transparent'}`} />
                    </span>
                    <span className="flex flex-col gap-1">
                      <strong className="flex items-center gap-2 text-[15px]">
                        <Icon name={icono} size={18} />
                        {label}
                      </strong>
                      <span className="text-[13px] leading-[1.4] text-muted">{desc}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
          {hayErrores && <AlertaError>Revisa los datos de envío marcados para continuar.</AlertaError>}
          {crear.isError && <AlertaError>{mensajeError(crear.error, 'No pudimos crear tu pedido.')}</AlertaError>}
        </div>
        <aside
          aria-label="Resumen del pedido"
          className="flex flex-[1_1_320px] flex-col gap-3 rounded-lg border border-line bg-white p-[22px] lg:sticky lg:top-[140px]"
        >
          <h2 className="m-0 mb-1 font-display text-[19px] font-semibold">Tu pedido</h2>
          {lineas.map(({ item, total }) => (
            <div key={item.producto_id} className="flex items-start gap-2.5 text-sm">
              <span className="bg-stripes grid size-11 shrink-0 place-items-center rounded-[5px] text-primary-dark">
                <Icon name={iconoCategoria(item.categoriaSlug)} size={20} />
              </span>
              <span className="min-w-0 flex-1 leading-[1.35]">
                {item.nombre} <span className="tabular text-muted-2">× {item.cantidad}</span>
              </span>
              <strong className="tabular whitespace-nowrap">{fmt(total)}</strong>
            </div>
          ))}
          <div className="my-1 h-px bg-line" />
          <div className="tabular flex justify-between text-[15px]">
            <span>Subtotal ({plural(unidades, 'producto', 'productos')})</span>
            <span>{fmt(subtotal)}</span>
          </div>
          {ahorro > 0 && (
            <div className="tabular flex justify-between text-[15px] font-bold text-ok">
              <span>Ahorro con {ETIQUETA_PRECIO[nivel]}</span>
              <span>−{fmt(ahorro)}</span>
            </div>
          )}
          <div className="tabular flex justify-between text-[15px]">
            <span>Envío</span>
            <span className={envio != null ? 'text-ink' : 'text-muted'}>{envio != null ? `${fmt(envio)} (estimado)` : 'Ingresa tu dirección'}</span>
          </div>
          <div className="my-1 h-px bg-line" />
          <div className="flex items-baseline justify-between">
            <span className="font-bold">Total a pagar</span>
            <span className="tabular font-display text-[26px] font-bold">{fmt(subtotal)}</span>
          </div>
          <span className="-mt-1.5 text-xs text-muted">El costo del envío se confirma con tu pedido y no se suma a este cobro.</span>
          <button
            type="button"
            onClick={confirmar}
            disabled={crear.isPending || creada}
            className="flex h-[54px] items-center justify-center gap-2.5 rounded-md bg-accent font-display text-base font-bold tracking-[0.04em] text-accent-ink uppercase hover:bg-accent-dark disabled:opacity-70"
          >
            {crear.isPending && <Spinner size={18} />}
            {crear.isPending ? 'Creando pedido…' : metodo === 'WOMPI' ? `Pagar ${fmt(subtotal)}` : 'Confirmar pedido'}
          </button>
          <span className="flex items-center justify-center gap-2 text-[13px] text-muted">
            <Icon name="lock" size={14} />
            Tus datos viajan cifrados
          </span>
        </aside>
      </div>
    </div>
  )
}
