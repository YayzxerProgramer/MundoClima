import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useProductos } from '../../api/catalogo'
import { useDebounce } from '../../hooks/util'
import { iconoCategoria } from '../../lib/constantes'
import { fmt } from '../../lib/formato'
import { Icon } from '../ui/Icon'

/** Buscador del header con sugerencias de GET /productos?q=…&limite=5. */
export function Buscador() {
  const navigate = useNavigate()
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(false)
  const q = useDebounce(texto.trim(), 250)
  const activo = abierto && texto.trim().length >= 2
  const sugerencias = useProductos({ q, limite: 5 }, { enabled: q.length >= 2 })
  const lista = q.length >= 2 ? (sugerencias.data?.datos ?? []) : []

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const v = texto.trim()
    if (!v) return
    setTexto('')
    setAbierto(false)
    navigate(`/productos?q=${encodeURIComponent(v)}`)
  }

  return (
    <form onSubmit={enviar} role="search" className="relative m-0">
      <div className="flex h-12 items-center overflow-hidden rounded-md border-2 border-primary bg-white">
        <span className="flex pr-2 pl-3 text-faint">
          <Icon name="search" size={22} />
        </span>
        <input
          type="search"
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setAbierto(true) }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 120)}
          placeholder="Busca por SKU, equipo o especificación — ej. mini split 12000"
          aria-label="Buscar productos"
          autoComplete="off"
          className="h-full min-w-0 flex-1 border-0 bg-transparent text-[14.5px] text-ink outline-none"
        />
        <button
          type="submit"
          className="h-full bg-primary px-[22px] font-display text-sm font-bold tracking-[0.04em] text-white hover:bg-primary-dark"
        >
          BUSCAR
        </button>
      </div>
      {activo && (
        <div
          role="listbox"
          aria-label="Sugerencias"
          className="absolute top-[54px] right-0 left-0 z-60 rounded-md border border-line bg-white py-2.5 shadow-[0_12px_28px_rgba(16,35,50,0.16)]"
        >
          <div className="px-3.5 pt-0.5 pb-2 text-[11px] font-semibold tracking-[0.08em] text-muted-2 uppercase">
            Productos sugeridos
          </div>
          {lista.map((p) => (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected="false"
              onMouseDown={(e) => {
                e.preventDefault()
                setTexto('')
                setAbierto(false)
                navigate(`/producto/${p.slug}`)
              }}
              className="flex w-full items-center gap-3 px-3.5 py-2 text-left hover:bg-line-2"
            >
              <span className="bg-stripes grid size-11 shrink-0 place-items-center rounded border border-line text-ph">
                <Icon name={iconoCategoria(p.categoria?.slug)} size={22} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[13px] font-medium">{p.nombre}</span>
                <span className="font-mono text-[11.5px] text-muted-2">
                  {p.marca?.nombre} · {p.sku}
                </span>
              </span>
              <span className="tabular font-display text-sm font-bold whitespace-nowrap text-primary">{fmt(p.precio_aplicado)}</span>
            </button>
          ))}
          {!sugerencias.isFetching && q.length >= 2 && lista.length === 0 && (
            <div className="px-3.5 py-2 text-[13px] text-muted">Sin coincidencias. Prueba con una marca, un BTU o un SKU.</div>
          )}
          <div className="my-2 h-px bg-line" />
          <button type="submit" className="flex w-full items-center gap-2 px-3.5 py-1.5 text-left text-[13px] font-semibold text-primary">
            <Icon name="search" size={18} />
            Ver todos los resultados para “{texto.trim()}”
          </button>
        </div>
      )}
    </form>
  )
}
