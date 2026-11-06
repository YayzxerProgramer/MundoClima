import { Suspense, type ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router'
import { Spinner } from '../ui/basicos'
import { Icon } from '../ui/Icon'

const secciones: [string, string, string, boolean?][] = [
  ['/admin', 'Resumen', 'monitoring', true],
  ['/admin/pedidos', 'Pedidos', 'receipt_long'],
  ['/admin/productos', 'Productos', 'inventory_2'],
  ['/admin/usuarios', 'Usuarios', 'group'],
]

/** Panel de administración: menú lateral en escritorio, pestañas con scroll en móvil. */
export function AdminLayout() {
  return (
    <div className="mx-auto grid max-w-[1340px] gap-6 px-[clamp(16px,4vw,32px)] pt-[clamp(18px,3vw,28px)] lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-[150px] lg:self-start">
        <div className="mb-2 hidden px-3 text-[11px] font-bold tracking-[0.08em] text-muted-2 uppercase lg:block">Administración</div>
        <nav aria-label="Administración" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:flex-col lg:overflow-visible">
          {secciones.map(([to, label, icono, end]) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex h-11 shrink-0 items-center gap-2.5 rounded-md px-3 text-sm font-semibold whitespace-nowrap hover:no-underline ${isActive ? 'bg-primary text-white hover:text-white' : 'text-ink-2 hover:bg-line-2 hover:text-primary'}`
              }
            >
              <Icon name={icono} size={20} />
              {label}
            </NavLink>
          ))}
          <NavLink
            to="/productos"
            className="flex h-11 shrink-0 items-center gap-2.5 rounded-md px-3 text-sm font-semibold whitespace-nowrap text-primary-dark hover:bg-line-2 hover:no-underline lg:mt-2"
          >
            <Icon name="storefront" size={20} />
            Ver la tienda
          </NavLink>
        </nav>
      </aside>
      <div className="min-w-0">
        <Suspense
          fallback={
            <div className="grid min-h-[40vh] place-items-center">
              <Spinner size={32} color="#084B75" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </div>
    </div>
  )
}

/** Encabezado común de cada sección del panel. */
export function CabeceraAdmin({ eyebrow, titulo, children }: { eyebrow: string; titulo: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-[11.5px] font-bold tracking-[0.1em] text-primary uppercase">{eyebrow}</div>
        <h1 className="m-0 mt-1 font-display text-[clamp(22px,3vw,30px)] font-bold text-ink">{titulo}</h1>
      </div>
      {children}
    </div>
  )
}
