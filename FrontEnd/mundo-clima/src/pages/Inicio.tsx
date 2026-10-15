import { useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import isotipoBlanco from '../assets/marca/mc-isotipo-blanco.png'
import { useFiltros, useMarcas, useNivel, useProductos } from '../api/catalogo'
import { TarjetaProducto } from '../components/TarjetaProducto'
import { Skeleton } from '../components/ui/basicos'
import { Icon } from '../components/ui/Icon'
import { useResumenCarrito } from '../hooks/carrito'
import { useCategoriasVM } from '../hooks/categorias'
import { ETIQUETA_PRECIO } from '../lib/constantes'
import { btn } from '../lib/estilos'
import { fmt, plural } from '../lib/formato'
import { useAuth } from '../store/auth'

const h2 = 'm-0 font-display text-xl font-bold text-ink'

function Beneficio({ icono, titulo, texto, color = 'text-primary' }: { icono: string; titulo: string; texto: string; color?: string }) {
  return (
    <div className="flex gap-[13px] rounded-lg border border-line bg-white p-[18px]">
      <span className={`flex ${color}`}>
        <Icon name={icono} size={28} />
      </span>
      <div>
        <div className="font-display text-sm font-bold">{titulo}</div>
        <div className="mt-1 text-[12.5px] text-muted">{texto}</div>
      </div>
    </div>
  )
}

export default function Inicio() {
  const navigate = useNavigate()
  const usuario = useAuth((s) => s.usuario)
  const nivel = useNivel()
  const esB2B = nivel !== 'CLIENTE_FINAL'
  const { lista: categorias, cargando: cargandoCats } = useCategoriasVM()
  const filtros = useFiltros()
  const marcas = useMarcas()
  const destacados = useProductos({ ordenarPor: 'destacados', limite: 12 })
  const listaDestacados = (destacados.data?.datos ?? []).filter((p) => p.es_destacado)
  const { ahorro } = useResumenCarrito()
  const carrusel = useRef<HTMLDivElement>(null)
  const irRegistroPro = () => navigate('/registro?tipo=TECNICO')

  return (
    <div className="mx-auto max-w-[1340px] px-[clamp(16px,4vw,32px)] pt-5">
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[minmax(0,1fr)_330px]">
        <section aria-labelledby="mc-hero-t" className="relative flex min-h-[340px] items-center overflow-hidden rounded-lg bg-primary">
          <div aria-hidden="true" className="absolute top-1/2 -right-[140px] -mt-[310px] size-[620px] rounded-full border-[70px] border-[rgba(40,168,224,0.22)]" />
          <div aria-hidden="true" className="absolute top-1/2 -right-10 -mt-[210px] size-[420px] rounded-full border-[28px] border-[rgba(157,214,235,0.18)]" />
          <img aria-hidden="true" alt="" src={isotipoBlanco} className="absolute top-1/2 right-14 -mt-[121px] hidden h-[242px] w-[250px] opacity-90 lg:block" />
          <div className="relative flex max-w-full flex-col gap-3.5 p-[clamp(24px,4vw,44px)] text-white lg:max-w-[58%]">
            <span className="flex items-center gap-1.5 self-start rounded-[3px] bg-accent px-2.5 py-[5px] text-[11.5px] font-bold tracking-[0.1em] text-accent-ink">
              <Icon name="home" size={16} />
              PARA TU HOGAR O NEGOCIO
            </span>
            <span aria-hidden="true" className="h-1 w-16 bg-accent" />
            <h1 id="mc-hero-t" className="m-0 font-display text-[clamp(30px,4vw,42px)] leading-[1.08] font-bold text-balance">
              Aires acondicionados listos para instalar
            </h1>
            <p className="m-0 max-w-[46ch] text-[15px] leading-normal text-[#D5E7F2]">
              Mini Split y Piso Techo de LG y Carrier, de 12.000 a 60.000 BTU, para habitaciones, oficinas y locales. Enviamos a toda Colombia.
            </p>
            <div className="flex flex-wrap gap-2">
              {(filtros.data?.tiposEquipo ?? []).map((t) => (
                <Link
                  key={t}
                  to={`/productos?categoria=aires-acondicionados&tipo=${encodeURIComponent(t)}`}
                  className="flex h-[34px] items-center rounded-full border border-white/40 bg-white/6 px-3.5 text-[13px] font-semibold text-white hover:bg-white/14 hover:text-white hover:no-underline"
                >
                  {t}
                </Link>
              ))}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-3">
              <Link to="/productos?categoria=aires-acondicionados" className={`${btn.base} ${btn.accent} h-12 px-6 text-sm hover:text-accent-ink hover:no-underline`}>
                Ver aires acondicionados
              </Link>
              <Link
                to="/productos"
                className={`${btn.base} h-12 border-[1.5px] border-white/55 px-[22px] text-sm text-white hover:bg-white/10 hover:text-white hover:no-underline`}
              >
                Ver todo el catálogo
              </Link>
            </div>
          </div>
        </section>
        <div className="flex flex-col gap-3">
          <section className="flex flex-col gap-2.5 rounded-lg border border-line bg-white p-[18px]">
            <div className="flex items-center gap-2.5">
              <span className="flex text-primary">
                <Icon name="badge" size={24} />
              </span>
              <strong className="font-display text-base font-bold">Para técnicos y distribuidores</strong>
            </div>
            <p className="m-0 text-[12.5px] leading-normal text-muted">
              {esB2B
                ? `Compresores, refrigerantes, componentes, válvulas, tubería y herramientas. Ya ves tu ${ETIQUETA_PRECIO[nivel]} en todo el catálogo.`
                : 'Compresores, refrigerantes, componentes eléctricos, válvulas, tubería y herramientas. Ingresa con tu cuenta profesional y ve tu precio en cada producto.'}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {categorias
                .filter((c) => c.slug !== 'aires-acondicionados')
                .map((c) => (
                  <Link
                    key={c.id}
                    to={`/productos?categoria=${c.slug}`}
                    className="flex min-w-0 items-center gap-[7px] rounded-[5px] border border-line bg-white px-[9px] py-[7px] text-xs font-semibold text-ink hover:border-primary hover:text-primary hover:no-underline"
                  >
                    <span className="flex text-primary">
                      <Icon name={c.icono} size={18} />
                    </span>
                    <span className="min-w-0 truncate">{c.nombre.replace(' de Refrigeración', '')}</span>
                  </Link>
                ))}
            </div>
            {esB2B ? (
              <div className="flex items-center gap-2 rounded-[5px] bg-ok-bg px-[11px] py-[9px] text-[12.5px] font-semibold text-ok-ink">
                <Icon name="check_circle" size={18} />
                Ya ves tu {ETIQUETA_PRECIO[nivel]}
              </div>
            ) : (
              <button type="button" onClick={irRegistroPro} className={`${btn.base} ${btn.outline} h-[42px] text-[13px]`}>
                Crear cuenta profesional
              </button>
            )}
          </section>
          <div className="flex items-center gap-3 rounded-lg border border-line bg-white p-3.5">
            <span className="flex text-ok">
              <Icon name="verified_user" size={26} />
            </span>
            <span className="text-[12.5px] text-muted">
              <strong className="text-ink">Pago seguro con Wompi.</strong> Tarjeta, PSE y Nequi, o paga contraentrega.
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-line bg-white p-3.5">
            <span className="flex text-primary">
              <Icon name="local_shipping" size={26} />
            </span>
            <span className="text-[12.5px] text-muted">
              <strong className="text-ink">Envíos con Coordinadora.</strong> Cotiza en la ficha y rastrea tu guía.
            </span>
          </div>
        </div>
      </div>

      <h2 className={`${h2} mt-[34px] mb-3.5`}>Compra por categoría</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2.5">
        {cargandoCats
          ? Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="h-[124px] rounded-lg" />)
          : categorias.map((c) => (
              <Link
                key={c.id}
                to={`/productos?categoria=${c.slug}`}
                className="flex min-h-[124px] flex-col items-center justify-center gap-2 rounded-lg border border-line bg-white px-2 py-3.5 text-center transition hover:border-primary hover:no-underline hover:shadow-[0_4px_14px_rgba(16,35,50,0.09)]"
              >
                <span className="grid size-14 place-items-center rounded-full bg-primary text-white">
                  <Icon name={c.icono} size={30} />
                </span>
                <span className="text-[12.5px] leading-[1.25] font-semibold text-pretty text-ink">{c.nombre}</span>
                <span className="tabular text-[11.5px] text-muted-2">{plural(c.conteo, 'producto', 'productos')}</span>
              </Link>
            ))}
      </div>

      <div className="mt-9 mb-3.5 flex items-center gap-3.5">
        <h2 className={h2}>Productos destacados</h2>
        <Link to="/productos" className="text-[13px] font-semibold text-primary">
          Ver todo
        </Link>
        <div className="ml-auto hidden gap-1.5 lg:flex">
          {(['chevron_left', 'chevron_right'] as const).map((ic, i) => (
            <button
              key={ic}
              type="button"
              onClick={() => carrusel.current?.scrollBy({ left: i ? 560 : -560, behavior: 'smooth' })}
              aria-label={i ? 'Siguientes' : 'Anteriores'}
              className="grid size-10 place-items-center rounded border border-line bg-white text-primary hover:border-primary"
            >
              <Icon name={ic} size={22} />
            </button>
          ))}
        </div>
      </div>
      <div ref={carrusel} className="-mx-0.5 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-0.5 pt-0.5 pb-3.5 [scrollbar-width:thin]">
        {destacados.isLoading
          ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[460px] flex-[0_0_220px] rounded-lg md:flex-[0_0_264px]" />)
          : listaDestacados.map((p) => (
              <div key={p.id} className="flex-[0_0_220px] snap-start md:flex-[0_0_264px]">
                <TarjetaProducto producto={p} />
              </div>
            ))}
      </div>

      <section id="mc-b2b" className="mt-7">
        {esB2B ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border-2 border-primary bg-white px-6 py-5">
            <div className="flex items-center gap-3.5">
              <span className="grid size-[52px] shrink-0 place-items-center rounded-md bg-ok-bg text-ok">
                <Icon name="verified" size={28} />
              </span>
              <div>
                <div className="font-display text-[clamp(18px,2vw,22px)] font-bold">Estás comprando con {ETIQUETA_PRECIO[nivel]}</div>
                <div className="mt-[3px] text-[13.5px] text-muted">
                  Tu precio aparece en cada producto y en el carrito. {ahorro > 0 ? `En tu carrito ya ahorras ${fmt(ahorro)}.` : ''}
                </div>
              </div>
            </div>
            <Link to="/productos" className={`${btn.base} ${btn.primary} h-[46px] px-5 text-[13.5px] hover:text-white hover:no-underline`}>
              Ir al catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] overflow-hidden rounded-lg border border-line bg-white">
            <div className="flex flex-col gap-3 bg-primary p-[clamp(22px,3vw,32px)] text-white">
              <span className="text-[11.5px] font-bold tracking-[0.1em] text-sky">CUENTAS PROFESIONALES</span>
              <span aria-hidden="true" className="h-1 w-14 bg-accent" />
              <h2 className="m-0 font-display text-[clamp(22px,2.6vw,28px)] leading-[1.15] font-bold text-balance">
                Precios especiales para técnicos y distribuidores
              </h2>
              <p className="m-0 max-w-[56ch] leading-[1.55] text-[#D5E7F2]">
                Cada producto tiene un precio para cuenta Técnico y otro para cuenta Distribuidor. Al iniciar sesión lo ves en el catálogo, en la ficha y en el carrito, con el ahorro frente al precio público.
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2.5">
                <button type="button" onClick={irRegistroPro} className={`${btn.base} ${btn.accent} h-[46px] px-5 text-[13.5px]`}>
                  Crear cuenta profesional
                </button>
                {!usuario && (
                  <Link
                    to="/ingresar"
                    className={`${btn.base} h-[46px] border-[1.5px] border-white/55 px-5 text-[13.5px] text-white hover:bg-white/10 hover:text-white hover:no-underline`}
                  >
                    Ya tengo cuenta
                  </Link>
                )}
              </div>
            </div>
            <ol className="m-0 flex list-none flex-col justify-center gap-4 p-[clamp(18px,3vw,28px)]">
              {[
                ['Crea tu cuenta como técnico o distribuidor', 'Con tu documento o NIT y el nombre de tu empresa.'],
                ['Inicia sesión', 'Los precios del catálogo se actualizan a tu nivel.'],
                ['Compra con tu precio', 'Paga en línea con Wompi o contraentrega.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex items-start gap-3.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded bg-tint font-display text-base font-bold text-primary">{i + 1}</span>
                  <span>
                    <strong className="block text-sm">{t}</strong>
                    <span className="text-[13px] text-muted">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <div className="mt-7 rounded-lg border border-line bg-white px-6 py-5">
        <div className="mb-3.5 text-[11px] font-semibold tracking-[0.08em] text-muted-2 uppercase">Marcas que manejamos</div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2.5">
          {(marcas.data ?? []).filter((m) => m.esta_activo).map((m) => (
            <Link
              key={m.id}
              to={`/productos?marca=${m.slug}`}
              className="py-1 font-display text-[17px] font-semibold tracking-[0.04em] text-muted-2 hover:text-primary hover:no-underline"
            >
              {m.nombre}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3.5">
        <Beneficio icono="local_shipping" titulo="Envíos con Coordinadora" texto="A todo el país, con número de guía para rastrear." />
        <Beneficio icono="verified_user" titulo="Pago en línea con Wompi" texto="Tarjeta, PSE o Nequi." />
        <Beneficio icono="payments" titulo="Pago contraentrega" texto="Paga cuando recibas tu pedido." />
        <Beneficio icono="badge" titulo="Precios por nivel" texto="Cuentas Técnico y Distribuidor con precio propio." />
      </div>
    </div>
  )
}
