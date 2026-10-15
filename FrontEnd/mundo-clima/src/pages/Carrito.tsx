import { Link, useNavigate } from 'react-router'
import { useNivel } from '../api/catalogo'
import { Migas } from '../components/ui/basicos'
import { Icon } from '../components/ui/Icon'
import { useQuitarDelCarrito, useResumenCarrito, useSincronizarCarrito } from '../hooks/carrito'
import { useCategoriasVM } from '../hooks/categorias'
import { ETIQUETA_PRECIO, iconoCategoria, MOSTRAR_FOTOS, TAG_NIVEL } from '../lib/constantes'
import { btn } from '../lib/estilos'
import { fmt, plural } from '../lib/formato'
import { useAuth } from '../store/auth'
import { useCarrito } from '../store/carrito'
import { FotoProducto } from '../components/ui/basicos'

export default function Carrito() {
  useSincronizarCarrito()
  const navigate = useNavigate()
  const usuario = useAuth((s) => s.usuario)
  const nivel = useNivel()
  const tag = TAG_NIVEL[nivel] ?? TAG_NIVEL.TECNICO!
  const { lineas, subtotal, ahorro, unidades } = useResumenCarrito()
  const cambiarCantidad = useCarrito((s) => s.cambiarCantidad)
  const quitar = useQuitarDelCarrito()
  const { lista: categorias } = useCategoriasVM()
  const agotados = lineas.some((l) => l.item.stock <= 0)
  const popular = [...categorias].sort((a, b) => b.conteo - a.conteo).slice(0, 4)
  const filas = 'grid grid-cols-[auto_minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_150px_130px_140px_44px]'

  return (
    <div className="mx-auto max-w-[1340px] px-[clamp(16px,4vw,32px)] pt-3.5">
      <Migas items={[{ label: 'Inicio', to: '/' }, { label: 'Carrito' }]} />
      <h1 className="mt-3 mb-0 font-display text-[clamp(24px,2.6vw,28px)] font-bold text-ink">
        Mi carrito{' '}
        <span className="tabular font-sans text-base font-normal text-muted">({plural(unidades, 'producto', 'productos')})</span>
      </h1>

      {lineas.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_372px]">
          <div className="min-w-0 overflow-hidden rounded-lg border border-line bg-white">
            <div className={`${filas} hidden gap-3 border-b border-line bg-page px-4 py-[11px] text-[11px] font-semibold tracking-[0.08em] text-muted uppercase lg:grid`}>
              <span>Producto</span>
              <span>Precio unitario</span>
              <span>Cantidad</span>
              <span className="text-right">Total</span>
              <span />
            </div>
            {lineas.map(({ item, unitario, base, b2b, total }) => {
              const agotado = item.stock <= 0
              return (
                <div key={item.producto_id} className={`${filas} items-center gap-3 border-b border-line-2 p-4`}>
                  <div className="col-span-full flex min-w-0 gap-[13px] lg:col-span-1">
                    <Link to={`/producto/${item.slug}`} aria-label={`Ver ${item.nombre}`} className="size-[86px] shrink-0 overflow-hidden rounded-[5px] border border-line">
                      <FotoProducto
                        imagen={MOSTRAR_FOTOS ? item.imagen : null}
                        icono={iconoCategoria(item.categoriaSlug)}
                        alt={item.nombre}
                        iconSize={40}
                        className="size-full"
                      />
                    </Link>
                    <div className="flex min-w-0 flex-col gap-[3px]">
                      <span className="text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase">{item.marca}</span>
                      <Link to={`/producto/${item.slug}`} className="text-sm leading-[1.3] font-semibold text-ink hover:text-primary hover:no-underline">
                        {item.nombre}
                      </Link>
                      <span className="font-mono text-[11.5px] text-muted-2">SKU {item.sku}</span>
                      {b2b && (
                        <span className="mt-0.5 self-start rounded-[3px] px-[7px] py-0.5 text-[10.5px] font-semibold uppercase" style={{ background: tag[0], color: tag[1] }}>
                          {ETIQUETA_PRECIO[nivel]}
                        </span>
                      )}
                      <span className="tabular text-[12.5px] text-ink-2 lg:hidden">{fmt(unitario)} c/u</span>
                      {agotado ? (
                        <span className="text-xs font-semibold text-err">Agotado: quítalo para continuar</span>
                      ) : (
                        item.cantidad >= item.stock && (
                          <span className="text-xs font-semibold text-warn">Máximo disponible: {item.stock}</span>
                        )
                      )}
                      <button type="button" onClick={() => quitar(item.producto_id)} className="mt-1 self-start text-xs font-semibold text-primary">
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="tabular hidden flex-col gap-0.5 lg:flex">
                    <strong className="font-display text-[15px] font-bold">{fmt(unitario)}</strong>
                    {b2b && <s className="text-xs text-muted-2">{fmt(base)}</s>}
                  </div>
                  <div role="group" aria-label="Cantidad" className="flex items-center self-center justify-self-start overflow-hidden rounded-[5px] border border-line bg-white">
                    <button
                      type="button"
                      onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)}
                      disabled={item.cantidad <= 1}
                      aria-label="Disminuir cantidad"
                      className="grid size-[42px] place-items-center bg-white text-primary disabled:opacity-35"
                    >
                      <Icon name="remove" size={20} />
                    </button>
                    <span className="tabular min-w-10 border-x border-line text-center font-display text-[15px] leading-[42px] font-bold">{item.cantidad}</span>
                    <button
                      type="button"
                      onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)}
                      disabled={item.cantidad >= item.stock}
                      aria-label="Aumentar cantidad"
                      className="grid size-[42px] place-items-center bg-white text-primary disabled:opacity-35"
                    >
                      <Icon name="add" size={20} />
                    </button>
                  </div>
                  <span className="tabular text-right font-display text-[17px] font-bold text-primary">{fmt(total)}</span>
                  <button
                    type="button"
                    onClick={() => quitar(item.producto_id)}
                    aria-label={`Eliminar ${item.nombre}`}
                    className="grid size-11 place-items-center rounded-[5px] text-faint hover:bg-err-bg hover:text-err"
                  >
                    <Icon name="delete" size={22} />
                  </button>
                </div>
              )
            })}
            <div className="px-4 py-3.5">
              <Link to="/productos" className={`${btn.base} ${btn.outline} h-11 px-4 text-[12.5px] hover:no-underline`}>
                Seguir comprando
              </Link>
            </div>
          </div>
          <aside aria-label="Resumen del pedido" className="flex flex-col gap-3 rounded-lg border border-line bg-white p-5 lg:sticky lg:top-[124px]">
            <h2 className="m-0 mb-1 font-display text-lg font-bold">Resumen del pedido</h2>
            <div className="tabular flex justify-between gap-3 text-sm">
              <span className="text-muted">Subtotal ({plural(unidades, 'producto', 'productos')})</span>
              <span>{fmt(subtotal)}</span>
            </div>
            {ahorro > 0 && (
              <div className="tabular flex justify-between gap-3 text-sm font-semibold text-ok">
                <span>Ahorro con {ETIQUETA_PRECIO[nivel]}</span>
                <span>−{fmt(ahorro)}</span>
              </div>
            )}
            <div className="flex justify-between gap-3 text-sm text-muted">
              <span>Envío</span>
              <span>Se cotiza en el checkout</span>
            </div>
            <div className="my-1 h-px bg-line" />
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-bold">Total parcial</span>
              <span className="tabular font-display text-[28px] font-bold">{fmt(subtotal)}</span>
            </div>
            {!usuario && (
              <div className="flex gap-[9px] rounded-[5px] bg-tint px-3 py-[11px] text-[12.5px] leading-[1.45] text-ink-2">
                <span className="flex text-primary">
                  <Icon name="lock" size={18} />
                </span>
                Para pagar necesitas iniciar sesión o crear tu cuenta. Tu carrito te espera y vuelves directo al pago.
              </div>
            )}
            {agotados && <div className="text-[12.5px] font-semibold text-err">Hay productos agotados en tu carrito.</div>}
            <button
              type="button"
              disabled={agotados}
              onClick={() => navigate('/checkout')}
              className={`${btn.base} ${btn.accent} h-[52px] text-[15px]`}
            >
              {usuario ? 'Continuar al pago' : 'Ingresar y pagar'}
              <Icon name="arrow_forward" size={20} />
            </button>
            <span className="flex items-center justify-center gap-[7px] text-xs text-muted">
              <span className="flex text-ok">
                <Icon name="verified_user" size={17} />
              </span>
              Wompi: tarjeta, PSE, Nequi · Contraentrega
            </span>
          </aside>
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-2.5 rounded-lg border border-line bg-white px-8 py-14 text-center">
          <span className="flex text-faint">
            <Icon name="remove_shopping_cart" size={56} />
          </span>
          <h2 className="mt-1.5 mb-0 font-display text-xl font-bold">Tu carrito está vacío</h2>
          <p className="m-0 text-[13.5px] text-muted">Explora el catálogo y agrega lo que necesites.</p>
          <div className="mt-2.5 flex flex-wrap justify-center gap-2">
            {popular.map((c) => (
              <Link
                key={c.id}
                to={`/productos?categoria=${c.slug}`}
                className="flex h-9 items-center gap-[7px] rounded-full border border-line bg-white px-[13px] text-[12.5px] text-primary hover:border-primary hover:bg-tint hover:no-underline"
              >
                <span className="flex">
                  <Icon name={c.icono} size={17} />
                </span>
                {c.nombre}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
