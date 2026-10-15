import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon } from './Icon'

export function Spinner({ size = 18, color = '#28A8E0' }: { size?: number; color?: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0 animate-spin-mc rounded-full"
      style={{
        width: size,
        height: size,
        border: `${Math.max(2, Math.round(size / 10))}px solid rgba(220,227,234,0.7)`,
        borderTopColor: color,
      }}
    />
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-skeleton animate-shimmer rounded-[5px] ${className}`} />
}

export interface Miga {
  label: string
  to?: string
}

export function Migas({ items }: { items: Miga[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="flex flex-wrap items-center gap-[7px] text-[12.5px] text-muted">
      {items.map((m, i) => (
        <span key={i} className="flex min-w-0 items-center gap-[7px]">
          {m.to ? (
            <>
              <Link to={m.to} className="text-primary hover:text-primary">
                {m.label}
              </Link>
              <span aria-hidden="true" className="text-faint">
                /
              </span>
            </>
          ) : (
            <span aria-current="page" className="text-ink">
              {m.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}

/** Contenedor de ancho máximo con el gutter del diseño. */
export function Contenedor({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1340px] px-[clamp(16px,4vw,32px)] ${className}`}>{children}</div>
}

/** Bloque de foto del producto: foto del backend si está activada, si no el ícono de la categoría sobre rayas. */
export function FotoProducto({
  imagen,
  icono,
  alt,
  iconSize,
  className = '',
}: {
  imagen: string | null
  icono: string
  alt: string
  iconSize: number
  className?: string
}) {
  return (
    <span className={`bg-stripes relative block overflow-hidden ${className}`}>
      {imagen ? (
        <span
          role="img"
          aria-label={alt}
          className="block size-full bg-cover bg-center"
          style={{ backgroundImage: `url(${imagen})` }}
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-ph">
          <Icon name={icono} size={iconSize} stroke="1" />
        </span>
      )}
    </span>
  )
}

export function AlertaError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex gap-2.5 rounded-md bg-err-bg px-3.5 py-3 text-sm font-semibold text-err-ink">
      <Icon name="circle-alert" size={18} />
      <span>{children}</span>
    </div>
  )
}

export function Etiqueta({ bg, fg, children, className = '' }: { bg: string; fg: string; children: ReactNode; className?: string }) {
  return (
    <span className={`rounded-[3px] font-semibold uppercase ${className}`} style={{ background: bg, color: fg }}>
      {children}
    </span>
  )
}
