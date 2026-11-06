import { Icon } from './Icon'

/** Paginación del catálogo: anterior, números y siguiente. */
export function Paginacion({ pagina, total, onCambiar }: { pagina: number; total: number; onCambiar: (p: number) => void }) {
  if (total <= 1) return null
  return (
    <nav aria-label="Paginación" className="mt-7 flex flex-wrap justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onCambiar(pagina - 1)}
        disabled={pagina <= 1}
        aria-label="Página anterior"
        className="grid size-10 place-items-center rounded border border-line bg-white text-primary disabled:opacity-35"
      >
        <Icon name="chevron_left" size={22} />
      </button>
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onCambiar(n)}
          aria-current={n === pagina ? 'page' : undefined}
          className={`tabular h-10 min-w-10 rounded border font-display text-sm font-bold ${n === pagina ? 'border-primary bg-primary text-white' : 'border-line-strong bg-white text-ink'}`}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onCambiar(pagina + 1)}
        disabled={pagina >= total}
        aria-label="Página siguiente"
        className="grid size-10 place-items-center rounded border border-line bg-white text-primary disabled:opacity-35"
      >
        <Icon name="chevron_right" size={22} />
      </button>
    </nav>
  )
}
