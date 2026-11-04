import { useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import isotipoBlanco from '../assets/marca/mc-isotipo-blanco.png'
import { useNivel, useProductos } from '../api/catalogo'
import { TarjetaProducto } from '../components/TarjetaProducto'
import { Skeleton } from '../components/ui/basicos'
import { Icon } from '../components/ui/Icon'
import { useResumenCarrito } from '../hooks/carrito'
import { useCategoriasVM } from '../hooks/categorias'
import { ETIQUETA_PRECIO } from '../lib/constantes'
import { btn } from '../lib/estilos'
import { fmt, plural } from '../lib/formato'
import { useAuth, useEsAdmin } from '../store/auth'

const h2 = 'm-0 font-display text-xl font-bold text-ink'

const BENEFICIOS: [string, string, string][] = [
  ['local_shipping', 'Envíos a toda Colombia', 'Con Coordinadora y número de guía.'],
  ['verified_user', 'Pago seguro', 'Wompi: tarjeta, PSE o Nequi.'],
  ['payments', 'Contraentrega', 'Paga cuando recibas tu pedido.'],
]

export default function Inicio() {
  const navigate = useNavigate()
  const usuario = useAuth((s) => s.usuario)
  const esAdmin = useEsAdmin()
  const nivel = useNivel()
  const esB2B = nivel !== 'CLIENTE_FINAL'
  const { lista: categorias, cargando: cargandoCats } = useCategoriasVM()
  const destacados = useProductos({ ordenarPor: 'destacados', limite: 12 })
  const listaDestacados = (destacados.data?.datos ?? []).filter((p) => p.es_destacado)
  const { ahorro } = useResumenCarrito()
  const carrusel = useRef<HTMLDivElement>(null)

  return (
    <div className="mx-auto max-w-[1340px] px-[clamp(16px,4vw,32px)] pt-5">
      <section aria-labelledby="mc-hero-t" className="relative flex min-h-[300px] items-center overflow-hidden rounded-lg bg-primary">
        <div aria-hidden="true" className="absolute top-1/2 -right-[140px] -mt-[310px] size-[620px] rounded-full border-[70px] border-[rgba(40,168,224,0.22)]" />
        <img aria-hidden="true" alt="" src={isotipoBlanco} className="absolute top-1/2 right-16 -mt-[110px] hidden h-[220px] w-[228px] opacity-90 lg:block" />
        <div className="relative flex max-w-full flex-col gap-4 p-[clamp(24px,4vw,48px)] text-white lg:max-w-[60%]">
          <span className="text-[11.5px] font-bold tracking-[0.12em] text-sky">EQUIPOS · REPUESTOS · INSUMOS</span>
          <h1 id="mc-hero-t" className="m-0 font-display text-[clamp(30px,4vw,44px)] leading-[1.08] font-bold text-balance">
            Climatización y refrigeración en un solo lugar
          </h1>
          <p className="m-0 max-w-[48ch] text-[15px] leading-normal text-[#D5E7F2]">
            Aires acondicionados, compresores, refrigerantes y herramientas para tu hogar, tu negocio o tu próximo proyecto.
          </p>
          <div className="mt-1 flex flex-wrap gap-3">
            <Link to="/productos" className={`${btn.base} ${btn.accent} h-12 px-6 text-sm hover:text-accent-ink hover:no-underline`}>
              Ver el catálogo
            </Link>
            <Link
              to="/productos?categoria=aires-acondicionados"
              className={`${btn.base} h-12 border-[1.5px] border-white/55 px-[22px] text-sm text-white hover:bg-white/10 hover:text-white hover:no-underline`}
            >
              Aires acondicionados
            </Link>
          </div>
        </div>
      </section>

      <h2 className={`${h2} mt-10 mb-3.5`}>Compra por categoría</h2>
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

      <div className="mt-10 mb-3.5 flex items-center gap-3.5">
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

      {!esAdmin && (
        <section id="mc-b2b" className="mt-8">
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
            <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5 rounded-lg bg-primary px-[clamp(22px,3vw,36px)] py-7 text-white">
              <div className="flex max-w-[640px] min-w-0 flex-col gap-2">
                <span className="text-[11.5px] font-bold tracking-[0.1em] text-sky">CUENTAS PROFESIONALES</span>
                <h2 className="m-0 font-display text-[clamp(20px,2.4vw,26px)] leading-[1.2] font-bold text-balance">
                  ¿Eres técnico o distribuidor? Compra con tu propio precio
                </h2>
                <p className="m-0 text-[14.5px] leading-[1.55] text-[#D5E7F2]">
                  Crea tu cuenta con tu documento o NIT, inicia sesión y verás tu precio especial en todo el catálogo, con el ahorro frente al precio
                  público.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button type="button" onClick={() => navigate('/registro?tipo=TECNICO')} className={`${btn.base} ${btn.accent} h-[46px] px-5 text-[13.5px]`}>
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
          )}
        </section>
      )}

      <ul className="m-0 mt-8 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-x-6 gap-y-3 border-t border-line p-0 pt-6">
        {BENEFICIOS.map(([icono, titulo, texto]) => (
          <li key={titulo} className="flex items-center gap-3">
            <span className="flex text-primary">
              <Icon name={icono} size={26} />
            </span>
            <span className="text-[13px] text-muted">
              <strong className="block text-sm text-ink">{titulo}</strong>
              {texto}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
