import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { fmt } from '../../lib/formato'

interface Props {
  min: number
  max: number
  desde: number
  hasta: number
  /** Se llama al soltar el control o al terminar de escribir, no en cada movimiento. */
  onCambio: (desde: number, hasta: number) => void
}

const TICKS: [number, string][] = [
  [100000, '100 mil'],
  [500000, '500 mil'],
  [2000000, '2 M'],
]

/**
 * Slider doble en escala logarítmica, como en el diseño (los precios van de miles a millones).
 * El estado inicial sale de las props: el padre lo monta con key={desde-hasta} para reiniciarlo.
 */
export function RangoPrecio({ min, max, desde, hasta, onCambio }: Props) {
  const pista = useRef<HTMLDivElement>(null)
  const [a, setA] = useState(desde)
  const [b, setB] = useState(hasta)
  const [txtA, setTxtA] = useState<string | null>(null)
  const [txtB, setTxtB] = useState<string | null>(null)
  // Valores vigentes para los listeners de window durante el arrastre.
  const actual = useRef({ a, b })
  useEffect(() => { actual.current = { a, b } }, [a, b])

  const aPos = (v: number) => (max > min ? Math.log(v / min) / Math.log(max / min) : 0)
  const dePos = (p: number) => {
    if (p <= 0) return min
    if (p >= 1) return max
    const v = min * Math.pow(max / min, p)
    const paso = v < 100000 ? 1000 : v < 1000000 ? 10000 : 50000
    return Math.min(max, Math.max(min, Math.round(v / paso) * paso))
  }

  const confirmar = (na: number, nb: number) => onCambio(na, nb)

  const onPointerDown = (e: PointerEvent) => {
    const el = pista.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const pos = (x: number) => Math.min(1, Math.max(0, (x - r.left) / r.width))
    const p0 = pos(e.clientX)
    const cual = Math.abs(p0 - aPos(a)) < Math.abs(p0 - aPos(b)) || p0 < aPos(a) ? 'min' : 'max'
    const aplicar = (x: number) => {
      const v = dePos(pos(x))
      if (cual === 'min') setA(Math.min(v, actual.current.b))
      else setB(Math.max(v, actual.current.a))
    }
    aplicar(e.clientX)
    const mover = (ev: globalThis.PointerEvent) => aplicar(ev.clientX)
    const soltar = () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      confirmar(actual.current.a, actual.current.b)
    }
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
  }

  const teclado = (cual: 'min' | 'max') => (e: KeyboardEvent) => {
    const d = ({ ArrowRight: 0.02, ArrowUp: 0.02, ArrowLeft: -0.02, ArrowDown: -0.02, PageUp: 0.1, PageDown: -0.1 } as Record<string, number>)[e.key]
    let v: number
    if (e.key === 'Home') v = min
    else if (e.key === 'End') v = max
    else if (d) v = dePos(aPos(cual === 'min' ? a : b) + d)
    else return
    e.preventDefault()
    if (cual === 'min') { const na = Math.min(v, b); setA(na); confirmar(na, b) } else { const nb = Math.max(v, a); setB(nb); confirmar(a, nb) }
  }

  const confirmarTexto = (cual: 'min' | 'max') => {
    const raw = cual === 'min' ? txtA : txtB
    if (raw == null) return
    let v = parseInt(raw.replace(/\D/g, ''), 10)
    if (isNaN(v)) v = cual === 'min' ? min : max
    v = Math.min(max, Math.max(min, v))
    if (cual === 'min') { const na = Math.min(v, b); setA(na); setTxtA(null); confirmar(na, b) } else { const nb = Math.max(v, a); setB(nb); setTxtB(null); confirmar(a, nb) }
  }

  const pa = aPos(a) * 100
  const pb = aPos(b) * 100
  const thumb =
    'absolute top-[5px] -ml-2.5 size-5 cursor-grab rounded-full border-2 border-primary bg-white shadow-[0_1px_3px_rgba(16,35,50,0.25)]'
  const caja =
    'tabular h-[38px] min-w-0 flex-1 rounded border border-line px-2 text-[13px] outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(40,168,224,0.4)]'

  return (
    <>
      <div ref={pista} onPointerDown={onPointerDown} className="relative mx-2.5 h-[30px] cursor-pointer touch-none">
        <div className="absolute top-[13px] right-0 left-0 h-1 rounded bg-line" />
        <div className="absolute top-[13px] h-1 rounded bg-primary" style={{ left: `${pa}%`, width: `${pb - pa}%` }} />
        <div
          role="slider"
          tabIndex={0}
          aria-label="Precio mínimo"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={a}
          aria-valuetext={fmt(a)}
          onKeyDown={teclado('min')}
          className={thumb}
          style={{ left: `${pa}%` }}
        />
        <div
          role="slider"
          tabIndex={0}
          aria-label="Precio máximo"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={b}
          aria-valuetext={fmt(b)}
          onKeyDown={teclado('max')}
          className={thumb}
          style={{ left: `${pb}%` }}
        />
      </div>
      <div className="tabular relative mx-2.5 mb-2.5 h-4 text-[11px] text-muted-2">
        {TICKS.filter(([v]) => v > min && v < max).map(([v, label]) => (
          <span key={v} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${aPos(v) * 100}%` }}>
            {label}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          inputMode="numeric"
          aria-label="Precio mínimo"
          value={txtA ?? fmt(a)}
          onChange={(e) => setTxtA(e.target.value)}
          onBlur={() => confirmarTexto('min')}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className={caja}
        />
        <span className="text-faint">—</span>
        <input
          inputMode="numeric"
          aria-label="Precio máximo"
          value={txtB ?? fmt(b)}
          onChange={(e) => setTxtB(e.target.value)}
          onBlur={() => confirmarTexto('max')}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className={caja}
        />
      </div>
    </>
  )
}
