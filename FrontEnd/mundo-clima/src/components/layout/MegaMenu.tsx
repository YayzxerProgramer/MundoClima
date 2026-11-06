import { useState, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useDestacadosCategoria, useNivel } from '../../api/catalogo'
import { useCategoriasVM } from '../../hooks/categorias'
import { irASeccionB2B } from '../../hooks/util'
import { ETIQUETA_PRECIO, QUICK_LINKS } from '../../lib/constantes'
import { fmt } from '../../lib/formato'
import { Skeleton } from '../ui/basicos'
import { Icon } from '../ui/Icon'

export function MegaMenu() {
  const navigate = useNavigate()
  const nivel = useNivel()
  const esB2B = nivel !== 'CLIENTE_FINAL'
  const { lista } = useCategoriasVM()
  const [abierto, setAbierto] = useState(false)
  const [idx, setIdx] = useState(0)
  const actual = lista[idx]
  const destacados = useDestacadosCategoria(actual?.slug, abierto)
  const prods = destacados.data?.datos ?? []
  // keepPreviousData mostraría los de la categoría anterior mientras carga la nueva
  const cargando = destacados.isLoading || destacados.isPlaceholderData

  const enfocar = (i: number) => setTimeout(() => document.getElementById(`mc-mega-${i}`)?.focus(), 0)
  const ir = (to: string) => { setAbierto(false); navigate(to) }

  const onTeclaMenu = (e: KeyboardEvent) => {
    const n = lista.length
    if (!n) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const j = (idx + (e.key === 'ArrowDown' ? 1 : -1) + n) % n
      setIdx(j)
      enfocar(j)
    } else if (e.key === 'Escape') {
      setAbierto(false)
      document.getElementById('mc-mega-btn')?.focus()
    }
  }

  return (
    <nav aria-label="Principal" onMouseLeave={() => setAbierto(false)} className="relative border-t border-line-2 bg-white">
      <div className="mx-auto flex max-w-[1340px] items-stretch gap-0.5 px-[clamp(16px,4vw,32px)]">
        <button
          type="button"
          id="mc-mega-btn"
          onClick={() => setAbierto((v) => !v)}
          onMouseEnter={() => setAbierto(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setAbierto(true); setIdx(0); enfocar(0) }
          }}
          aria-expanded={abierto}
          aria-controls="mc-mega"
          className={`flex h-11 items-center gap-2 px-[18px] font-display text-[13px] font-bold tracking-[0.05em] text-white ${abierto ? 'bg-primary-dark' : 'bg-primary'}`}
        >
          <Icon name="menu" size={20} />
          TODAS LAS CATEGORÍAS
          <Icon name="expand_more" size={18} />
        </button>
        {QUICK_LINKS.map(([slug, nombre]) => (
          <Link
            key={slug}
            to={`/productos?categoria=${slug}`}
            onMouseEnter={() => setAbierto(false)}
            className="flex h-11 items-center border-b-[3px] border-transparent px-[13px] text-[13px] whitespace-nowrap text-ink hover:border-accent hover:text-primary hover:no-underline"
          >
            {nombre}
          </Link>
        ))}
        <Link
          to="/"
          onClick={irASeccionB2B}
          onMouseEnter={() => setAbierto(false)}
          className="ml-auto flex h-11 items-center gap-[7px] pr-1 pl-3.5 text-[12.5px] font-semibold whitespace-nowrap text-primary-dark hover:text-primary hover:no-underline"
        >
          <Icon name="badge" size={18} />
          Técnicos y distribuidores
        </Link>
      </div>
      {abierto && actual && (
        <div
          id="mc-mega"
          onKeyDown={onTeclaMenu}
          className="absolute top-full right-0 left-0 z-50 border-y border-line bg-white shadow-[0_18px_34px_rgba(16,35,50,0.14)]"
        >
          <div className="mx-auto grid min-h-[400px] max-w-[1340px] grid-cols-[290px_minmax(0,1fr)_300px] px-[clamp(16px,4vw,32px)]">
            <ul role="menu" aria-label="Categorías" className="m-0 flex list-none flex-col gap-0.5 border-r border-line-2 py-3.5 pr-3.5 pl-0">
              {lista.map((c, i) => (
                <li key={c.id} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    id={`mc-mega-${i}`}
                    onMouseEnter={() => setIdx(i)}
                    onFocus={() => setIdx(i)}
                    onClick={() => ir(`/productos?categoria=${c.slug}`)}
                    className={`flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-[13.5px] font-medium ${i === idx ? 'bg-tint text-primary' : 'text-ink-3'}`}
                  >
                    <Icon name={c.icono} size={22} />
                    <span className="flex-1">{c.nombre}</span>
                    <span className="tabular text-[11.5px] text-muted-2">{c.conteo}</span>
                    <Icon name="chevron_right" size={18} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex min-w-0 flex-col gap-3.5 px-[26px] py-[18px]">
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="m-0 font-display text-lg font-bold text-primary">{actual.nombre}</h3>
                <button
                  type="button"
                  onClick={() => ir(`/productos?categoria=${actual.slug}`)}
                  className="text-[12.5px] font-semibold text-primary-dark hover:underline"
                >
                  Ver toda la categoría ({actual.conteo})
                </button>
              </div>
              <p className="-mt-1.5 mb-0 max-w-[60ch] text-[13px] text-muted">{actual.descripcion}</p>
              <div className="text-[11px] font-semibold tracking-[0.08em] text-muted-2 uppercase">Destacados de la categoría</div>
              {cargando ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,190px))] gap-3.5">
                  {Array.from({ length: Math.min(4, actual.conteo) || 1 }, (_, i) => (
                    <div key={i} className="flex flex-col gap-2 rounded-md border border-line-3 p-2.5">
                      <Skeleton className="aspect-[4/3]" />
                      <Skeleton className="h-3" />
                      <Skeleton className="h-3 w-[70%]" />
                      <Skeleton className="h-3.5 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,180px))] gap-3">
                  {prods.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => ir(`/producto/${p.slug}`)}
                      className="flex flex-col gap-1.5 rounded-md border border-line bg-white p-2.5 text-left hover:border-primary"
                    >
                      <span className="bg-stripes grid h-[100px] w-full place-items-center rounded text-ph">
                        <Icon name={actual.icono} size={40} stroke="1" />
                      </span>
                      <span className="line-clamp-2 min-h-[2.7em] text-[12.5px] leading-[1.35] font-medium">{p.nombre}</span>
                      <span className="tabular font-display text-[15px] font-bold text-primary">{fmt(p.precio_aplicado)}</span>
                      {p.tiene_descuento_b2b && (
                        <span className="text-[11px] font-semibold text-primary uppercase">{ETIQUETA_PRECIO[nivel]}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3.5 border-l border-line-2 bg-page p-[18px]">
              <div className="text-[11px] font-semibold tracking-[0.08em] text-muted-2 uppercase">Cuentas profesionales</div>
              <div className="flex flex-col gap-2 rounded-md border border-line bg-white p-3.5">
                <span className="flex items-center gap-2 font-display text-[15px] font-bold text-primary">
                  <Icon name="badge" size={20} />
                  Precio Técnico y Distribuidor
                </span>
                <span className="text-[12.5px] leading-[1.45] text-muted">
                  {esB2B
                    ? `Estás viendo tu ${ETIQUETA_PRECIO[nivel]} en todo el catálogo y en el carrito.`
                    : 'Ingresa con tu cuenta profesional y ve tu precio en cada producto, con el ahorro frente al precio público.'}
                </span>
                {!esB2B && (
                  <button
                    type="button"
                    onClick={() => ir('/registro?tipo=TECNICO')}
                    className="mt-1 h-10 rounded-md bg-accent font-display text-[13px] font-bold tracking-[0.04em] text-accent-ink uppercase"
                  >
                    Crear cuenta profesional
                  </button>
                )}
              </div>
              <div className="flex items-start gap-[9px] text-xs leading-[1.45] text-muted">
                <span className="flex text-primary">
                  <Icon name="local_shipping" size={18} />
                </span>
                Enviamos con Coordinadora a todo el país. Cotiza el envío desde la ficha del producto.
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
