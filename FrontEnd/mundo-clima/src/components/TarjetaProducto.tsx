import { Link } from 'react-router'
import { useNivel } from '../api/catalogo'
import { useAgregarAlCarrito } from '../hooks/carrito'
import { ETIQUETA_PRECIO, iconoCategoria, MOSTRAR_FOTOS, TAG_NIVEL } from '../lib/constantes'
import { fmt } from '../lib/formato'
import { chipsProducto, estadoStock } from '../lib/producto'
import { useEsAdmin } from '../store/auth'
import { useUI } from '../store/ui'
import type { Producto } from '../types/api'
import { FotoProducto } from './ui/basicos'
import { Icon } from './ui/Icon'

const botonAgregar =
  'flex h-11 items-center justify-center gap-1.5 rounded-[5px] font-display text-[13px] font-bold tracking-[0.04em] transition'

export function TarjetaProducto({ producto: p, vista = 'grid' }: { producto: Producto; vista?: 'grid' | 'list' }) {
  const nivel = useNivel()
  const agregar = useAgregarAlCarrito()
  const agregado = useUI((s) => s.agregado === p.id)
  const esAdmin = useEsAdmin()
  const tag = TAG_NIVEL[nivel] ?? TAG_NIVEL.TECNICO!
  const st = estadoStock(p)
  const b2b = p.tiene_descuento_b2b
  const url = `/producto/${p.slug}`
  const icono = iconoCategoria(p.categoria?.slug)
  const imagen = MOSTRAR_FOTOS ? (p.imagenes?.[0] ?? null) : null
  const chips = chipsProducto(p)

  const precio = (
    <>
      {b2b && (
        <>
          <span
            className="mb-1 self-start rounded-[3px] px-[7px] py-[3px] text-[11px] font-semibold uppercase tracking-[0.03em]"
            style={{ background: tag[0], color: tag[1] }}
          >
            {ETIQUETA_PRECIO[nivel]}
          </span>
          <span className="tabular text-xs text-muted-2">
            PVP <s>{fmt(p.precio_base)}</s>
          </span>
        </>
      )}
      <div className="tabular font-display text-[22px] leading-[1.1] font-bold text-primary">{fmt(p.precio_aplicado)}</div>
      {b2b && (
        <span className="tabular text-[11.5px] font-semibold text-ok">
          Ahorras {fmt(p.monto_ahorro)} ({p.porcentaje_ahorro}%)
        </span>
      )}
    </>
  )

  const stock = (
    <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: st.color }}>
      <Icon name={st.icono} size={17} />
      {st.texto}
    </div>
  )

  const accion = esAdmin ? (
    <Link to={url} className={`${botonAgregar} border-[1.5px] border-primary bg-white text-primary hover:bg-tint hover:no-underline`}>
      <Icon name="visibility" size={19} />
      VER FICHA
    </Link>
  ) : st.agotado ? (
    <button type="button" disabled className={`${botonAgregar} border border-line bg-line-2 text-muted`}>
      AGOTADO
    </button>
  ) : agregado ? (
    <button type="button" aria-live="polite" className={`${botonAgregar} bg-ok text-white`}>
      <Icon name="check" size={19} />
      AGREGADO
    </button>
  ) : (
    <button
      type="button"
      onClick={() => agregar(p)}
      className={`${botonAgregar} bg-accent text-accent-ink hover:bg-accent-dark active:scale-[0.98]`}
    >
      <Icon name="add_shopping_cart" size={19} />
      AGREGAR
    </button>
  )

  const listaChips = (
    <div className="flex flex-wrap gap-[5px]">
      {chips.map((c) => (
        <span key={c} className="tabular rounded-[3px] border border-line bg-soft px-[7px] py-0.5 text-[11.5px] font-medium text-ink-2">
          {c}
        </span>
      ))}
    </div>
  )

  if (vista === 'list') {
    return (
      <article className="flex flex-wrap gap-x-5 gap-y-3.5 rounded-lg border border-line bg-white p-3.5 transition hover:border-tint-line hover:shadow-[0_6px_18px_rgba(16,35,50,0.10)]">
        <Link to={url} aria-label={`Ver ${p.nombre}`} className="relative h-[130px] flex-[0_0_150px] overflow-hidden rounded-[5px] border border-line">
          <FotoProducto imagen={imagen} icono={icono} alt={p.nombre} iconSize={44} className="size-full" />
        </Link>
        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-[5px]">
          <div className="text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase">{p.marca?.nombre}</div>
          <Link to={url} className="text-[15px] leading-[1.3] font-semibold text-ink hover:text-primary hover:no-underline">
            {p.nombre}
          </Link>
          <div className="font-mono text-[11.5px] text-muted-2">SKU {p.sku}</div>
          <p className="mt-0.5 text-[13px] text-pretty text-muted">{p.descripcion_corta}</p>
          <div className="mt-1">{listaChips}</div>
        </div>
        <div className="flex flex-[0_1_210px] flex-col justify-center gap-[3px] border-l border-line-2 pl-4">
          {precio}
          <div className="mt-1.5 mb-2">{stock}</div>
          {accion}
        </div>
      </article>
    )
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white transition hover:border-tint-line hover:shadow-[0_6px_18px_rgba(16,35,50,0.10)]">
      <Link to={url} aria-label={`Ver ${p.nombre}`} className="relative block h-[180px] w-full">
        <FotoProducto imagen={imagen} icono={icono} alt={p.nombre} iconSize={60} className="size-full" />
        {st.bajo && (
          <span className="absolute top-2.5 left-2.5 rounded-[3px] bg-accent px-2 py-1 font-display text-[11.5px] font-bold tracking-[0.04em] text-accent-ink uppercase">
            {st.msgBajo}
          </span>
        )}
        {st.agotado && (
          <span className="absolute top-2.5 left-2.5 rounded-[3px] bg-muted px-2 py-1 font-display text-[11.5px] font-bold tracking-[0.04em] text-white">
            AGOTADO
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-[13px]">
        <div className="text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase">{p.marca?.nombre}</div>
        <Link
          to={url}
          className="mt-1 mb-[5px] line-clamp-2 min-h-[2.6em] text-sm leading-[1.3] font-semibold text-ink hover:text-primary hover:no-underline"
        >
          {p.nombre}
        </Link>
        <div className="mb-2 font-mono text-[11.5px] text-muted-2">SKU {p.sku}</div>
        <div className="mb-2.5">{listaChips}</div>
        <div className="mt-auto flex flex-col gap-0.5">{precio}</div>
        <div className="mt-[9px] mb-2.5">{stock}</div>
        {accion}
      </div>
    </article>
  )
}
