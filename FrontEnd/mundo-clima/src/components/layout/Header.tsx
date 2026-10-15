import { Link, useNavigate } from 'react-router'
import isotipo from '../../assets/marca/mc-isotipo.png'
import { useNivel } from '../../api/catalogo'
import { useResumenCarrito } from '../../hooks/carrito'
import { irASeccionB2B } from '../../hooks/util'
import { NIVEL_CORTO, ROL_LABEL, TAG_NIVEL } from '../../lib/constantes'
import { fmt, primerNombre } from '../../lib/formato'
import { useAuth } from '../../store/auth'
import { useUI } from '../../store/ui'
import { Icon } from '../ui/Icon'
import { Buscador } from './Buscador'
import { MegaMenu } from './MegaMenu'

const gutter = 'mx-auto max-w-[1340px] px-[clamp(16px,4vw,32px)]'

export function Header() {
  const navigate = useNavigate()
  const usuario = useAuth((s) => s.usuario)
  const nivel = useNivel()
  const esB2B = nivel !== 'CLIENTE_FINAL'
  const tag = TAG_NIVEL[nivel] ?? TAG_NIVEL.TECNICO!
  const { unidades, subtotal } = useResumenCarrito()
  const rebote = useUI((s) => s.rebote)
  const { abrirMiniCarrito, abrirMenuMovil } = useUI.getState()
  const nombre = primerNombre(usuario?.nombre_completo)

  return (
    <>
      <div className="bg-primary text-xs text-[#E3EEF5]">
        <div className={`${gutter} flex min-h-[34px] items-center gap-5`}>
          <span className="flex items-center gap-1.5">
            <Icon name="local_shipping" size={16} />
            Envíos a toda Colombia con Coordinadora
          </span>
          <span className="hidden items-center gap-1.5 lg:flex">
            <Icon name="credit_card" size={16} />
            Tarjeta, PSE, Nequi o contraentrega
          </span>
          <span className="ml-auto hidden items-center gap-[18px] lg:flex">
            <Link to="/rastreo" className="text-xs text-[#E3EEF5] hover:text-[#E3EEF5] hover:underline">
              Rastrear pedido
            </Link>
            <Link to="/" onClick={irASeccionB2B} className="flex items-center gap-1.5 text-xs font-semibold text-sky hover:text-sky hover:underline">
              <Icon name="badge" size={16} />
              Precios para técnicos y distribuidores
            </Link>
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className={`${gutter} flex flex-wrap items-center gap-x-3 gap-y-3 py-3.5 lg:gap-x-5`}>
          <button
            type="button"
            onClick={abrirMenuMovil}
            aria-label="Abrir menú"
            className="-ml-2 grid size-11 place-items-center rounded-md text-primary hover:bg-line-2 lg:hidden"
          >
            <Icon name="menu" size={26} />
          </button>
          <Link to="/" aria-label="Mundo Clima, ir al inicio" className="flex min-w-0 items-center gap-2.5 hover:no-underline">
            <img src={isotipo} alt="" className="size-9 shrink-0 object-contain md:size-11" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-[17px] font-extrabold tracking-[0.01em] whitespace-nowrap md:text-[22px]">
                <span className="text-primary">MUNDO</span> <span className="text-sky-2">CLIMA</span>
              </span>
              <span className="mt-[5px] hidden border-t border-primary pt-1 font-display text-[9.5px] font-semibold tracking-[0.14em] whitespace-nowrap text-primary lg:block">
                EQUIPOS · REPUESTOS · INSUMOS
              </span>
            </span>
          </Link>
          <div className="order-10 flex-[1_1_100%] lg:order-none lg:max-w-[640px] lg:flex-[1_1_360px]">
            <Buscador />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigate(usuario ? '/cuenta' : '/ingresar')}
              aria-label={usuario ? `Mi cuenta, ${nombre}` : 'Ingresar o crear cuenta'}
              className="flex min-h-11 items-center gap-[9px] rounded-md px-1.5 py-1.5 text-left hover:bg-line-2 lg:px-2.5"
            >
              <span className="flex text-primary">
                <Icon name="account_circle" size={28} />
              </span>
              <span className="hidden flex-col leading-[1.25] lg:flex">
                <span className="text-[11px] text-muted">{usuario ? `Hola, ${nombre}` : 'Hola, ingresa'}</span>
                <span className="text-[13px] font-semibold text-primary">{usuario ? 'Mi cuenta' : 'Ingresar / Crear cuenta'}</span>
              </span>
            </button>
            {esB2B && (
              <span
                className="hidden rounded-[3px] px-[9px] py-1 text-[11px] font-semibold tracking-[0.03em] whitespace-nowrap uppercase lg:inline"
                style={{ background: tag[0], color: tag[1] }}
              >
                {ROL_LABEL[nivel]}
              </span>
            )}
            <button
              type="button"
              onClick={abrirMiniCarrito}
              aria-label={`Carrito: ${unidades} productos`}
              className="flex min-h-11 items-center gap-[9px] rounded-md px-2 py-1.5 text-left hover:bg-line-2 lg:px-3"
            >
              <span className="relative flex text-primary">
                <Icon name="shopping_cart" size={28} />
                {unidades > 0 && (
                  <span
                    className="tabular absolute -top-[5px] -right-[9px] h-[19px] min-w-[19px] rounded-full bg-accent px-[5px] text-center text-[11px] leading-[19px] font-bold text-accent-ink transition-transform duration-200"
                    style={{ transform: `scale(${rebote ? 1.25 : 1})` }}
                  >
                    {unidades}
                  </span>
                )}
              </span>
              <span className="ml-1 hidden flex-col leading-[1.25] lg:flex">
                <span className="text-[11px] text-muted">Carrito</span>
                <span className="tabular text-[13px] font-bold text-primary">{fmt(subtotal)}</span>
              </span>
            </button>
          </div>
          {esB2B && (
            <div className="order-11 flex flex-[1_1_100%] items-center gap-2 text-xs text-muted lg:hidden">
              <span className="rounded-[3px] px-2 py-[3px] text-[11px] font-semibold uppercase" style={{ background: tag[0], color: tag[1] }}>
                {ROL_LABEL[nivel]}
              </span>
              <span>Ves precios {NIVEL_CORTO[nivel]} en toda la tienda</span>
            </div>
          )}
        </div>
        <div className="hidden lg:block">
          <MegaMenu />
        </div>
      </header>
    </>
  )
}
