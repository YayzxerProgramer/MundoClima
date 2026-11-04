import { useState, type MouseEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useNivel, useProducto, useProductos } from '../api/catalogo'
import { useCotizarEnvio } from '../api/cuenta'
import { TarjetaProducto } from '../components/TarjetaProducto'
import { Migas, Skeleton } from '../components/ui/basicos'
import { Icon } from '../components/ui/Icon'
import { useAgregarAlCarrito } from '../hooks/carrito'
import { useEsEscritorio } from '../hooks/util'
import { mensajeError, estadoHttp } from '../lib/api'
import { DEPARTAMENTOS, ETIQUETA_PRECIO, iconoCategoria, MOSTRAR_FOTOS } from '../lib/constantes'
import { btn } from '../lib/estilos'
import { fmt, fmtN, normalizar } from '../lib/formato'
import { estadoStock } from '../lib/producto'
import { useEsAdmin } from '../store/auth'
import { useUI } from '../store/ui'
import type { Producto as TProducto } from '../types/api'
import NoEncontrado from './NoEncontrado'

function especificaciones(p: TProducto): [string, string][] {
  const filas: [string, string][] = [
    ['Marca', p.marca?.nombre ?? '—'],
    ['Referencia (SKU)', p.sku],
  ]
  if (p.btu) filas.push(['Capacidad', `${fmtN(p.btu)} BTU`])
  if (p.tipo_refrigerante) filas.push(['Refrigerante', p.tipo_refrigerante])
  if (p.voltaje) filas.push(['Voltaje', p.voltaje])
  if (p.tipo_equipo) filas.push(['Tipo de equipo', p.tipo_equipo])
  Object.entries(p.especificaciones ?? {}).forEach(([k, v]) => {
    if (!filas.some((r) => normalizar(r[0]) === normalizar(k))) filas.push([k, String(v)])
  })
  if (p.categoria) filas.push(['Categoría', p.categoria.nombre])
  filas.push(['Unidad de venta', p.unidad_medida])
  return filas
}

const SIN_CLAVE = ['Marca', 'Referencia (SKU)', 'Categoría', 'Unidad de venta']

function Cotizador({ producto, cantidad, precio }: { producto: TProducto; cantidad: number; precio: number }) {
  const [dep, setDep] = useState('')
  const [ciudad, setCiudad] = useState('')
  const cotizar = useCotizarEnvio()
  const listo = !!dep && !!ciudad.trim()
  const cambiar = (fn: () => void) => { fn(); cotizar.reset() }

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-line bg-white p-4">
      <div className="font-display text-[12.5px] font-bold tracking-[0.05em] text-muted">CALCULA TU ENVÍO</div>
      <select
        aria-label="Departamento"
        value={dep}
        onChange={(e) => cambiar(() => setDep(e.target.value))}
        className="h-[42px] rounded-[5px] border border-line bg-white px-[9px] text-[13px] text-ink"
      >
        <option value="">Departamento</option>
        {DEPARTAMENTOS.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <input
          aria-label="Ciudad"
          placeholder="Ciudad o municipio"
          value={ciudad}
          onChange={(e) => cambiar(() => setCiudad(e.target.value))}
          className="h-[42px] min-w-0 flex-1 rounded-[5px] border border-line px-2.5 text-[13px] outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(40,168,224,0.4)]"
        />
        <button
          type="button"
          disabled={!listo || cotizar.isPending}
          onClick={() =>
            cotizar.mutate({
              departamento_destino: dep,
              ciudad_destino: ciudad.trim(),
              peso_total_kg: Math.max(0.1, (Number(producto.peso_kg) || 1) * cantidad),
              valor_declarado: precio * cantidad,
            })
          }
          className={`${btn.base} ${btn.primary} h-[42px] px-3.5 text-xs`}
        >
          {cotizar.isPending ? 'Cotizando…' : 'Cotizar envío'}
        </button>
      </div>
      {cotizar.data && (
        <div role="status" className="rounded-[5px] border border-ok-line bg-ok-bg p-2.5 text-[12.5px] leading-normal text-ok-ink">
          <strong className="tabular">Coordinadora · {fmt(cotizar.data.total_flete)}</strong>
          <br />
          Envío a {cotizar.data.ciudad_destino}, entrega en {cotizar.data.dias_entrega_estimados}{' '}
          {cotizar.data.dias_entrega_estimados === 1 ? 'día hábil' : 'días hábiles'}.
        </div>
      )}
      {cotizar.isError && <div role="alert" className="text-[12.5px] text-err">{mensajeError(cotizar.error)}</div>}
    </div>
  )
}

function FichaProducto({ slug }: { slug: string }) {
  const navigate = useNavigate()
  const nivel = useNivel()
  const esEscritorio = useEsEscritorio()
  const consulta = useProducto(slug)
  const p = consulta.data
  const [cantidad, setCantidad] = useState(1)
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null)
  const [tab, setTab] = useState<'ficha' | 'desc'>('ficha')
  const [fotoActiva, setFotoActiva] = useState(0)
  const agregar = useAgregarAlCarrito()
  const agregado = useUI((s) => !!p && s.agregado === p.id)
  const abrirMini = useUI((s) => s.abrirMiniCarrito)
  const esAdmin = useEsAdmin()

  const relacionados = useProductos({ categoria: p?.categoria?.slug, ordenarPor: 'destacados', limite: 5 }, { enabled: !!p?.categoria })
  const destacados = useProductos({ ordenarPor: 'destacados', limite: 5 }, { enabled: !!p })

  if (consulta.isError && estadoHttp(consulta.error) === 404) return <NoEncontrado />
  if (consulta.isError) {
    return (
      <div className="mx-auto max-w-[720px] px-4 pt-16 text-center">
        <p className="text-muted">{mensajeError(consulta.error, 'No pudimos cargar el producto.')}</p>
        <button type="button" onClick={() => consulta.refetch()} className={`${btn.base} ${btn.primary} mt-3 h-11 px-5 text-[13px]`}>
          Reintentar
        </button>
      </div>
    )
  }
  if (!p) {
    return (
      <div className="mx-auto max-w-[1340px] px-[clamp(16px,4vw,32px)] pt-3.5">
        <Skeleton className="h-3 w-64" />
        <div className="mt-3 grid grid-cols-1 gap-[22px] md:grid-cols-2 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_360px]">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    )
  }

  const st = estadoStock(p)
  const cant = Math.min(cantidad, Math.max(1, p.inventario_stock))
  const icono = iconoCategoria(p.categoria?.slug)
  const fotos = MOSTRAR_FOTOS ? p.imagenes : []
  const foto = fotos[fotoActiva] ?? fotos[0] ?? null
  const specs = especificaciones(p)
  const claves = specs.filter((r) => !SIN_CLAVE.includes(r[0]))
  const b2b = p.tiene_descuento_b2b
  const esB2B = nivel !== 'CLIENTE_FINAL'
  const tierMio = esB2B ? p.precios_nivel.find((t) => t.nivel_cliente === nivel && t.cantidad_minima === 1) : undefined
  const unidad = p.unidad_medida.toLowerCase()
  const unidades = p.unidad_medida === 'Unidad' ? 'unidades' : `${unidad}s`

  let rel = (relacionados.data?.datos ?? []).filter((x) => x.id !== p.id).slice(0, 4)
  let tituloRel = `Más en ${p.categoria?.nombre ?? 'la categoría'}`
  if (!rel.length) {
    rel = (destacados.data?.datos ?? []).filter((x) => x.id !== p.id && x.es_destacado).slice(0, 4)
    tituloRel = 'Productos destacados'
  }

  const onZoom = (e: MouseEvent<HTMLDivElement>) => {
    if (!esEscritorio) return
    const r = e.currentTarget.getBoundingClientRect()
    setZoom({ x: Math.round(((e.clientX - r.left) / r.width) * 100), y: Math.round(((e.clientY - r.top) / r.height) * 100) })
  }

  return (
    <div className="mx-auto max-w-[1340px] px-[clamp(16px,4vw,32px)] pt-3.5">
      <Migas
        items={[
          { label: 'Inicio', to: '/' },
          ...(p.categoria ? [{ label: p.categoria.nombre, to: `/productos?categoria=${p.categoria.slug}` }] : []),
          { label: p.nombre },
        ]}
      />
      <div className="mt-3 grid grid-cols-1 items-start gap-[22px] md:grid-cols-2 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-2.5">
          <div
            onMouseMove={onZoom}
            onMouseLeave={() => setZoom(null)}
            className="bg-stripes-lg relative aspect-[4/3] max-h-[min(70vw,480px)] w-full cursor-zoom-in overflow-hidden rounded-lg border border-line lg:aspect-square lg:max-h-none"
          >
            <div
              className="absolute inset-0 transition-transform duration-[180ms] ease-out"
              style={{ transform: zoom ? 'scale(2)' : 'none', transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : 'center' }}
            >
              {foto ? (
                <span role="img" aria-label={p.nombre} className="block size-full bg-cover bg-center" style={{ backgroundImage: `url(${foto})` }} />
              ) : (
                <span className="absolute inset-0 grid place-items-center text-ph">
                  <Icon name={icono} size={150} stroke="1" />
                </span>
              )}
            </div>
            {st.bajo && (
              <span className="absolute top-3 left-3 rounded-[3px] bg-accent px-[9px] py-[5px] font-display text-xs font-bold tracking-[0.04em] text-accent-ink uppercase">
                {st.msgBajo}
              </span>
            )}
            <span className="pointer-events-none absolute right-3 bottom-3 hidden items-center gap-[5px] rounded border border-line bg-white px-2.5 py-1.5 text-xs text-muted lg:flex">
              <Icon name="zoom_in" size={18} />
              Pasa el cursor para ampliar
            </span>
          </div>
          {fotos.length > 1 && (
            <div className="flex gap-2">
              {fotos.map((f, i) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFotoActiva(i)}
                  aria-label={`Foto ${i + 1}`}
                  className={`size-[68px] rounded-md border bg-cover bg-center ${i === fotoActiva ? 'border-primary' : 'border-line'}`}
                  style={{ backgroundImage: `url(${f})` }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] text-muted uppercase">
            {p.marca && (
              <Link to={`/productos?marca=${p.marca.slug}`} className="text-primary hover:text-primary">
                {p.marca.nombre}
              </Link>
            )}
            {p.marca && p.categoria && <span aria-hidden="true">·</span>}
            <span>{p.categoria?.nombre}</span>
          </div>
          <h1 className="m-0 font-display text-[clamp(22px,2.4vw,28px)] leading-[1.2] font-bold text-pretty text-ink">{p.nombre}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-muted">
            <span className="font-mono">SKU {p.sku}</span>
            <span>Unidad de venta: {unidad}</span>
          </div>
          {p.descripcion_corta && <p className="m-0 text-sm leading-normal text-ink-2">{p.descripcion_corta}</p>}
          {specs.length > 4 && claves.length > 0 && (
            <div className="border-y border-line py-4">
              <div className="mb-2.5 font-display text-sm font-bold tracking-[0.04em]">ESPECIFICACIONES CLAVE</div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-x-5 gap-y-[9px]">
                {claves.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2.5 border-b border-dotted border-line pb-[5px] text-[13px]">
                    <span className="text-muted">{k}</span>
                    <strong className="tabular text-right font-semibold">{v}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded border border-tint-line bg-tint px-[11px] py-[7px] text-[12.5px] font-semibold text-primary">
              <Icon name="credit_card" size={18} />
              Pago en línea o contraentrega
            </span>
            <span className="flex items-center gap-1.5 rounded border border-ok-line bg-ok-bg px-[11px] py-[7px] text-[12.5px] font-semibold text-ok-ink">
              <Icon name="verified_user" size={18} />
              Pago seguro con Wompi
            </span>
            <span className="flex items-center gap-1.5 rounded border border-line bg-page px-[11px] py-[7px] text-[12.5px] font-semibold text-ink-2">
              <Icon name="local_shipping" size={18} />
              Envío con Coordinadora
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:col-span-2 xl:sticky xl:top-[124px] xl:col-span-1">
          {b2b ? (
            <div className="overflow-hidden rounded-lg border-2 border-primary bg-white">
              <div className="flex items-center gap-2 bg-primary px-3.5 py-[9px] font-display text-[12.5px] font-bold tracking-[0.06em] text-white uppercase">
                <Icon name="badge" size={18} />
                {ETIQUETA_PRECIO[nivel]}
              </div>
              <div className="flex flex-col gap-1 p-4">
                <span className="tabular text-[13px] text-muted-2">
                  PVP <s>{fmt(p.precio_base)}</s>
                </span>
                <div className="tabular font-display text-4xl leading-[1.05] font-bold text-primary">{fmt(p.precio_aplicado)}</div>
                <span className="tabular text-[13px] font-bold text-ok">
                  Ahorras {fmt(p.monto_ahorro)} ({p.porcentaje_ahorro}%)
                </span>
                <span className="text-xs text-muted">Precio por {unidad}</span>
                {tierMio && (
                  <div className="mt-2.5 flex items-start gap-[7px] rounded-[5px] bg-tint px-2.5 py-[9px] text-xs text-ink-2">
                    <span className="flex text-primary">
                      <Icon name="lock" size={16} />
                    </span>
                    Tu {ETIQUETA_PRECIO[nivel]} aplica desde 1 {unidad}.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1 rounded-lg border border-line bg-white p-4">
              <div className="tabular font-display text-4xl leading-[1.05] font-bold text-primary">{fmt(p.precio_aplicado)}</div>
              <span className="text-xs text-muted">Precio por {unidad}</span>
              {!esB2B && !esAdmin && (
                <div className="mt-3 flex items-start gap-2.5 rounded-md border border-line bg-page p-3">
                  <span className="flex text-primary">
                    <Icon name="engineering" size={22} />
                  </span>
                  <div className="flex flex-col gap-[3px]">
                    <strong className="text-[13px]">¿Eres técnico o distribuidor?</strong>
                    <span className="text-[12.5px] text-muted">
                      Ingresa con tu cuenta profesional para ver tu precio especial en este producto.
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/ingresar?redirect=${encodeURIComponent(`/producto/${p.slug}`)}`)}
                        className={`${btn.base} ${btn.outline} h-9 px-3 text-xs`}
                      >
                        Iniciar sesión
                      </button>
                      <Link to="/registro?tipo=TECNICO" className="flex h-9 items-center px-1.5 text-[12.5px] font-semibold text-primary underline">
                        Crear cuenta profesional
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-lg border border-line bg-white p-4">
            {st.agotado ? (
              <div className="flex items-center gap-[7px] text-[13px] font-bold text-err">
                <Icon name="cancel" size={19} />
                Agotado
              </div>
            ) : st.bajo ? (
              <div className="flex items-center gap-[7px] text-[13px] font-bold text-warn">
                <Icon name="warning" size={19} />
                {st.msgBajo}
              </div>
            ) : (
              <div className="flex items-center gap-[7px] text-[13px] font-semibold text-ok">
                <Icon name="check_circle" size={19} />
                En stock · {p.inventario_stock} disponibles
              </div>
            )}
            {esAdmin ? (
              <div className="flex flex-col gap-2.5 rounded-md bg-tint p-3 text-[13px] text-ink-2">
                <span className="flex items-start gap-2">
                  <span className="flex text-primary">
                    <Icon name="admin_panel_settings" size={20} />
                  </span>
                  Estás viendo la tienda como administrador. Las cuentas de administrador no hacen pedidos.
                </span>
                <span className="font-mono text-[12px] text-muted">
                  SKU {p.sku} · alerta de stock en {p.alerta_stock_minimo}
                </span>
                <Link to="/admin/productos" className={`${btn.base} ${btn.outline} h-11 text-[13px] hover:no-underline`}>
                  Ir a productos del panel
                </Link>
              </div>
            ) : (
              <>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[12.5px] text-muted">Cantidad</span>
              <div role="group" aria-label="Cantidad" className="flex items-center overflow-hidden rounded-[5px] border border-line bg-white">
                <button
                  type="button"
                  onClick={() => setCantidad(Math.max(1, cant - 1))}
                  disabled={cant <= 1}
                  aria-label="Disminuir cantidad"
                  className="grid size-11 place-items-center bg-white text-primary disabled:opacity-35"
                >
                  <Icon name="remove" size={20} />
                </button>
                <input
                  value={cant}
                  onChange={(e) => {
                    const v = parseInt(e.target.value.replace(/\D/g, ''), 10)
                    setCantidad(isNaN(v) ? 1 : Math.max(1, Math.min(p.inventario_stock, v)))
                  }}
                  inputMode="numeric"
                  aria-label="Cantidad"
                  className="tabular h-11 w-[52px] border-x border-line bg-white text-center font-display text-base font-bold outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCantidad(Math.min(p.inventario_stock, cant + 1))}
                  disabled={cant >= p.inventario_stock}
                  aria-label="Aumentar cantidad"
                  className="grid size-11 place-items-center bg-white text-primary disabled:opacity-35"
                >
                  <Icon name="add" size={20} />
                </button>
              </div>
              {cant > 1 && (
                <span className="tabular text-[12.5px] text-ink-2">
                  Total por {cant} {unidades}: {fmt(p.precio_aplicado * cant)}
                </span>
              )}
            </div>
            {st.agotado ? (
              <button type="button" disabled className="h-[52px] w-full rounded-md border border-line bg-line-2 font-display text-[15px] font-bold tracking-[0.04em] text-muted">
                AGOTADO
              </button>
            ) : agregado ? (
              <button type="button" onClick={abrirMini} className={`${btn.base} h-[52px] w-full bg-ok text-[15px] text-white`}>
                <Icon name="check" size={22} />
                Agregado al carrito
              </button>
            ) : (
              <button
                type="button"
                onClick={() => agregar(p, cant, true)}
                className={`${btn.base} ${btn.accent} h-[52px] w-full text-[15px] active:scale-[0.99]`}
              >
                <Icon name="add_shopping_cart" size={22} />
                Agregar al carrito
              </button>
            )}
              </>
            )}
          </div>
          <Cotizador key={p.id} producto={p} cantidad={cant} precio={p.precio_aplicado} />
        </div>
      </div>

      <div className="mt-7 rounded-lg border border-line bg-white">
        <div role="tablist" aria-label="Información del producto" className="flex border-b border-line">
          {(
            [
              ['ficha', 'Ficha técnica'],
              ['desc', 'Descripción'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`-mb-px h-12 border-b-[3px] px-5 font-display text-sm font-bold whitespace-nowrap ${tab === k ? 'border-accent text-ink' : 'border-transparent text-muted'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="px-6 py-5">
          {tab === 'ficha' ? (
            <div role="tabpanel" className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-x-9">
              {specs.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line-2 py-[9px] text-[13px]">
                  <span className="text-muted">{k}</span>
                  <strong className="tabular text-right font-semibold">{v}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p role="tabpanel" className="m-0 max-w-[75ch] text-sm leading-[1.65] text-ink-2">
              {p.descripcion || p.descripcion_corta}
            </p>
          )}
        </div>
      </div>

      {rel.length > 0 && (
        <>
          <h2 className="mt-8 mb-3.5 font-display text-xl font-bold text-ink">{tituloRel}</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] md:gap-4">
            {rel.map((x) => (
              <TarjetaProducto key={x.id} producto={x} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** El key reinicia cantidad, zoom y pestañas al pasar de un producto a otro. */
export default function Producto() {
  const { slug = '' } = useParams()
  return <FichaProducto key={slug} slug={slug} />
}
