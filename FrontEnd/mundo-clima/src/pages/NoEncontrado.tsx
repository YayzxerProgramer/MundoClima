import { Link } from 'react-router'
import { btn } from '../lib/estilos'

export default function NoEncontrado() {
  return (
    <div className="mx-auto flex max-w-[720px] flex-col items-center gap-3.5 px-[clamp(16px,4vw,32px)] pt-[clamp(40px,8vw,96px)] text-center">
      <span className="tabular font-display text-[clamp(64px,12vw,112px)] leading-none font-bold tracking-[-0.03em] text-accent">404</span>
      <h1 className="m-0 font-display text-[clamp(22px,3vw,30px)] font-bold text-ink">No encontramos esta página</h1>
      <p className="m-0 max-w-[46ch] text-muted">
        Puede que el enlace haya cambiado o que el producto ya no esté disponible. Usa el buscador o vuelve al inicio.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2.5">
        <Link to="/" className={`${btn.base} ${btn.primary} h-12 px-5 hover:text-white hover:no-underline`}>
          Ir al inicio
        </Link>
        <Link to="/productos" className={`${btn.ghost} flex h-12 items-center rounded-md px-5 hover:no-underline`}>
          Ver catálogo
        </Link>
      </div>
    </div>
  )
}
