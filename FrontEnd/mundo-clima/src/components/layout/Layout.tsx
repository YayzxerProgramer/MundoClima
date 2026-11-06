import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import logoBlanco from '../../assets/marca/mc-logo-blanco.png'
import { registrarVisita } from '../../api/cuenta'
import { useCategoriasVM } from '../../hooks/categorias'
import { irASeccionB2B } from '../../hooks/util'
import { useUI } from '../../store/ui'
import { Header } from './Header'
import { MenuMovil, MiniCarrito, Scrim, Toast } from './Paneles'

const linkFooter = 'text-left text-sm text-[#C9D6E2] hover:text-white hover:underline'

function Footer() {
  const { lista } = useCategoriasVM()
  return (
    <footer className="mt-[72px] bg-primary text-[#C9D6E2]">
      <div className="mx-auto grid max-w-[1340px] grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-8 px-[clamp(16px,4vw,32px)] pt-12 pb-7">
        <div className="flex flex-col gap-3">
          <img src={logoBlanco} alt="Mundo Clima" className="h-[159px] w-[170px] self-start object-contain" />
          <p className="m-0 max-w-[32ch] text-sm leading-[1.55]">
            Climatización y refrigeración para hogares, comercios y profesionales en Colombia.
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <h3 className="m-0 mb-1 text-[13px] tracking-[0.06em] text-white uppercase">Comprar</h3>
          {lista.map((c) => (
            <Link key={c.id} to={`/productos?categoria=${c.slug}`} className={linkFooter}>
              {c.nombre}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2.5">
          <h3 className="m-0 mb-1 text-[13px] tracking-[0.06em] text-white uppercase">Ayuda</h3>
          <Link to="/rastreo" className={linkFooter}>
            Rastrear pedido
          </Link>
          <Link to="/cuenta/pedidos" className={linkFooter}>
            Mis pedidos
          </Link>
          <Link to="/ayuda" className={linkFooter}>
            Preguntas frecuentes
          </Link>
          <span className="text-sm">Envíos con Coordinadora</span>
          <span className="text-sm">Pagos con Wompi y contraentrega</span>
        </div>
        <div className="flex flex-col gap-2.5">
          <h3 className="m-0 mb-1 text-[13px] tracking-[0.06em] text-white uppercase">Profesionales</h3>
          <Link to="/registro?tipo=TECNICO" className="text-left text-sm font-semibold text-sky hover:text-sky hover:underline">
            Crear cuenta Técnico o Distribuidor
          </Link>
          <Link to="/" onClick={irASeccionB2B} className={linkFooter}>
            Cómo funcionan los precios por nivel
          </Link>
        </div>
      </div>
      <div className="border-t border-white/12">
        <div className="mx-auto flex max-w-[1340px] flex-wrap justify-between gap-x-6 gap-y-2 px-[clamp(16px,4vw,32px)] py-4 text-[13px] text-[#B8C6D3]">
          <span>© {new Date().getFullYear()} Mundo Clima S.A.S.</span>
          <span>Precios en pesos colombianos (COP)</span>
        </div>
      </div>
    </footer>
  )
}

export function Layout() {
  const { pathname } = useLocation()
  const menuMovil = useUI((s) => s.menuMovil)
  const miniCarrito = useUI((s) => s.miniCarrito)
  const cerrarPaneles = useUI((s) => s.cerrarPaneles)

  useEffect(() => {
    window.scrollTo({ top: 0 })
    cerrarPaneles()
    registrarVisita(pathname)
  }, [pathname, cerrarPaneles])

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && cerrarPaneles()
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [cerrarPaneles])

  return (
    <div className="flex min-h-screen flex-col bg-page font-sans text-ink">
      <a
        href="#contenido"
        className="absolute top-2 -left-[9999px] z-100 rounded-[5px] bg-white px-4 py-2.5 font-bold text-primary focus:left-4"
      >
        Saltar al contenido
      </a>
      <Header />
      <main id="contenido" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Scrim visible={menuMovil || miniCarrito} onClose={cerrarPaneles} />
      <MenuMovil />
      <MiniCarrito />
      <Toast />
    </div>
  )
}
