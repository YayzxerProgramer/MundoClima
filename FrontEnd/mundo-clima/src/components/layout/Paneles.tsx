import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useDestacadosCategoria } from '../../api/catalogo'
import { useQuitarDelCarrito, useResumenCarrito } from '../../hooks/carrito'
import { useCategoriasVM, type CategoriaVM } from '../../hooks/categorias'
import { irASeccionB2B } from '../../hooks/util'
import { ETIQUETA_PRECIO, iconoCategoria, TAG_NIVEL } from '../../lib/constantes'
import { fmt } from '../../lib/formato'
import { useNivel } from '../../api/catalogo'
import { useAuth } from '../../store/auth'
import { useCarrito } from '../../store/carrito'
import { useUI } from '../../store/ui'
import { Icon } from '../ui/Icon'

const panel = 'fixed top-0 bottom-0 z-[71] flex flex-col bg-white shadow-[0_0_40px_rgba(10,25,40,0.25)] transition-[transform,visibility] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]'

/** Fondo oscuro detrás de los paneles laterales. */
export function Scrim({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-70 bg-[rgba(10,25,40,0.45)] transition-opacity duration-250 ${visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
    />
  )
}

function CategoriaAcordeon({ c, abierta, onToggle, ir }: { c: CategoriaVM; abierta: boolean; onToggle: () => void; ir: (to: string) => void }) {
  const destacados = useDestacadosCategoria(c.slug, abierta)
  return (
    <div className="border-b border-line-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={abierta}
        className="flex min-h-[52px] w-full items-center gap-3 px-2 py-1.5 text-left text-[15px] font-semibold"
      >
        <span className="grid size-[34px] shrink-0 place-items-center rounded-[5px] bg-tint-2 text-primary">
          <Icon name={c.icono} size={18} />
        </span>
        <span className="flex-1">{c.nombre}</span>
        <span className="flex transition-transform duration-200" style={{ transform: `rotate(${abierta ? 180 : 0}deg)` }}>
          <Icon name="chevron-down" size={18} />
        </span>
      </button>
      {abierta && (
        <div className="flex flex-col gap-2.5 pr-2 pb-3.5 pl-[54px]">
          <p className="m-0 text-[13px] text-muted">{c.descripcion}</p>
          {(destacados.data?.datos ?? []).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => ir(`/producto/${p.slug}`)}
              className="flex justify-between gap-2.5 py-2 text-left text-sm"
            >
              <span className="min-w-0 flex-1 truncate">{p.nombre}</span>
              <strong className="tabular">{fmt(p.precio_aplicado)}</strong>
            </button>
          ))}
          <button
            type="button"
            onClick={() => ir(`/productos?categoria=${c.slug}`)}
            className="flex items-center gap-1.5 self-start py-1.5 text-sm font-bold text-primary-dark"
          >
            Ver todo ({c.conteo})
            <Icon name="arrow-right" size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

export function MenuMovil() {
  const navigate = useNavigate()
  const abierto = useUI((s) => s.menuMovil)
  const cerrar = useUI((s) => s.cerrarPaneles)
  const usuario = useAuth((s) => s.usuario)
  const { lista } = useCategoriasVM()
  const [acordeon, setAcordeon] = useState<string | null>(null)
  const ir = (to: string) => { cerrar(); navigate(to) }

  return (
    <aside
      aria-label="Menú de categorías"
      aria-hidden={!abierto}
      inert={!abierto}
      className={`${panel} left-0 w-[min(88vw,380px)] ${abierto ? 'visible translate-x-0' : 'invisible -translate-x-[105%]'}`}
    >
      <div className="flex items-center justify-between border-b border-line py-3.5 pr-4 pl-5">
        <span className="font-display text-base font-bold tracking-[0.03em] text-primary">
          MUNDO <span className="text-primary-dark">CLIMA</span>
        </span>
        <button type="button" onClick={cerrar} aria-label="Cerrar menú" className="grid size-11 place-items-center rounded-md">
          <Icon name="x" size={22} />
        </button>
      </div>
      <div className="flex-1 overflow-auto px-3 pt-3 pb-6">
        <div className="px-2 pt-2 pb-1.5 text-xs font-bold tracking-[0.06em] text-muted uppercase">Categorías</div>
        {lista.map((c) => (
          <CategoriaAcordeon
            key={c.id}
            c={c}
            abierta={acordeon === c.slug}
            onToggle={() => setAcordeon(acordeon === c.slug ? null : c.slug)}
            ir={ir}
          />
        ))}
        <div className="mt-4 flex flex-col gap-0.5">
          <button type="button" onClick={() => { ir('/'); irASeccionB2B() }} className="flex min-h-12 items-center gap-3 px-2 text-[15px] font-semibold text-primary">
            <Icon name="briefcase-business" size={20} />
            Técnicos y distribuidores
          </button>
          <button type="button" onClick={() => ir('/rastreo')} className="flex min-h-12 items-center gap-3 px-2 text-[15px] font-semibold">
            <Icon name="package-search" size={20} />
            Rastrear pedido
          </button>
          <button type="button" onClick={() => ir(usuario ? '/cuenta' : '/ingresar')} className="flex min-h-12 items-center gap-3 px-2 text-[15px] font-semibold">
            <Icon name="circle-user-round" size={20} />
            {usuario ? 'Mi cuenta' : 'Ingresar / Crear cuenta'}
          </button>
        </div>
      </div>
    </aside>
  )
}

export function MiniCarrito() {
  const navigate = useNavigate()
  const abierto = useUI((s) => s.miniCarrito)
  const cerrar = useUI((s) => s.cerrarPaneles)
  const usuario = useAuth((s) => s.usuario)
  const nivel = useNivel()
  const tag = TAG_NIVEL[nivel] ?? TAG_NIVEL.TECNICO!
  const { lineas, subtotal, ahorro, unidades } = useResumenCarrito()
  const cambiarCantidad = useCarrito((s) => s.cambiarCantidad)
  const quitar = useQuitarDelCarrito()
  const ir = (to: string) => { cerrar(); navigate(to) }

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-label="Carrito"
      aria-hidden={!abierto}
      inert={!abierto}
      className={`${panel} right-0 z-[81] w-[min(100vw,420px)] ${abierto ? 'visible translate-x-0' : 'invisible translate-x-[105%]'}`}
    >
      <div className="flex items-center justify-between border-b border-line py-3.5 pr-4 pl-5">
        <h2 className="m-0 font-display text-lg font-semibold">
          Tu carrito <span className="tabular text-muted-2">({unidades})</span>
        </h2>
        <button type="button" onClick={cerrar} aria-label="Cerrar carrito" className="grid size-11 place-items-center rounded-md">
          <Icon name="x" size={22} />
        </button>
      </div>
      {lineas.length > 0 ? (
        <>
          <div className="flex-1 overflow-auto px-5 py-1">
            {lineas.map(({ item, b2b, total }) => (
              <div key={item.producto_id} className="flex gap-3 border-b border-line-3 py-3.5">
                <span className="bg-stripes grid size-16 shrink-0 place-items-center rounded-[5px] text-primary-dark">
                  <Icon name={iconoCategoria(item.categoriaSlug)} size={28} stroke="1.25" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => ir(`/producto/${item.slug}`)}
                    className="line-clamp-2 text-left text-sm leading-[1.35] font-semibold"
                  >
                    {item.nombre}
                  </button>
                  {b2b && (
                    <span className="self-start rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ background: tag[0], color: tag[1] }}>
                      {ETIQUETA_PRECIO[nivel]}
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-2.5">
                    <div role="group" aria-label="Cantidad" className="flex h-9 items-center rounded-[5px] border border-line-strong">
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)}
                        disabled={item.cantidad <= 1}
                        aria-label="Disminuir"
                        className="grid h-full w-[34px] place-items-center disabled:opacity-35"
                      >
                        <Icon name="minus" size={14} />
                      </button>
                      <span className="tabular min-w-6 text-center text-sm font-bold">{item.cantidad}</span>
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)}
                        disabled={item.cantidad >= item.stock}
                        aria-label="Aumentar"
                        className="grid h-full w-[34px] place-items-center disabled:opacity-35"
                      >
                        <Icon name="plus" size={14} />
                      </button>
                    </div>
                    <span className="tabular font-bold">{fmt(total)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => quitar(item.producto_id)}
                  aria-label={`Eliminar ${item.nombre}`}
                  className="grid size-9 shrink-0 place-items-center rounded-[5px] text-muted-2 hover:bg-err-bg hover:text-err"
                >
                  <Icon name="trash-2" size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2.5 border-t border-line px-5 pt-4 pb-5">
            <div className="tabular flex justify-between text-base">
              <span className="font-semibold">Subtotal</span>
              <strong className="font-display text-[19px]">{fmt(subtotal)}</strong>
            </div>
            {ahorro > 0 && (
              <div className="tabular flex justify-between text-sm font-bold text-ok">
                <span>Ahorro con {ETIQUETA_PRECIO[nivel]}</span>
                <span>−{fmt(ahorro)}</span>
              </div>
            )}
            <span className="text-[13px] text-muted">El envío se cotiza con tu dirección en el checkout.</span>
            <button
              type="button"
              onClick={() => ir('/checkout')}
              className="h-[50px] rounded-md bg-accent font-display text-base font-bold tracking-[0.04em] text-accent-ink uppercase hover:bg-accent-dark"
            >
              {usuario ? 'Continuar al pago' : 'Ingresar y pagar'}
            </button>
            <button
              type="button"
              onClick={() => ir('/carrito')}
              className="h-[46px] rounded-md border border-line-strong bg-white font-bold text-primary hover:border-primary-dark"
            >
              Ver carrito
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="grid size-14 place-items-center rounded-lg bg-tint-2 text-primary">
            <Icon name="shopping-cart" size={28} />
          </span>
          <strong className="text-[17px]">Tu carrito está vacío</strong>
          <button
            type="button"
            onClick={() => ir('/productos')}
            className="h-[46px] rounded-md bg-primary px-5 font-display font-bold tracking-[0.04em] text-white uppercase"
          >
            Explorar catálogo
          </button>
        </div>
      )}
    </aside>
  )
}

export function Toast() {
  const toast = useUI((s) => s.toast)
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-90 flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-3 rounded-md bg-primary py-2.5 pr-2.5 pl-4 text-sm text-white shadow-[0_18px_40px_-12px_rgba(10,25,40,0.45)] transition-[transform,opacity] duration-250 ${toast ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'}`}
    >
      <span className="flex text-sky">
        <Icon name="circle-check" size={18} />
      </span>
      <span>{toast?.msg}</span>
      {toast?.accion && (
        <button
          type="button"
          onClick={toast.accion.fn}
          className="h-[34px] rounded bg-white/10 px-2.5 font-bold whitespace-nowrap text-sky"
        >
          {toast.accion.label}
        </button>
      )}
    </div>
  )
}
