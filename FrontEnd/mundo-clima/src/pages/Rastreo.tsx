import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useRastreo } from '../api/cuenta'
import { AlertaError } from '../components/ui/basicos'
import { Icon } from '../components/ui/Icon'
import { ESTADO_ENVIO } from '../lib/constantes'
import { fmtFecha } from '../lib/formato'

export default function Rastreo() {
  const { guia: guiaUrl } = useParams()
  const navigate = useNavigate()
  const [guia, setGuia] = useState(guiaUrl ?? '')
  const rastreo = useRastreo()
  const { mutate } = rastreo

  // /rastreo/:guia consulta directo (viene del detalle del pedido).
  useEffect(() => {
    if (guiaUrl) mutate(guiaUrl)
  }, [guiaUrl, mutate])

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const g = guia.replace(/\D/g, '')
    if (!g) return
    if (g === guiaUrl) mutate(g)
    else navigate(`/rastreo/${g}`)
  }

  const r = rastreo.data

  return (
    <div className="mx-auto max-w-[760px] px-[clamp(16px,4vw,32px)] pt-[clamp(24px,5vw,56px)]">
      <h1 className="m-0 font-display text-[clamp(24px,3vw,32px)] font-bold text-ink">Rastrea tu envío</h1>
      <p className="mt-2 mb-0 text-muted">Escribe el número de guía de Coordinadora que te enviamos por correo.</p>
      <form onSubmit={enviar} className="mt-5 flex flex-wrap gap-2.5">
        <input
          value={guia}
          onChange={(e) => { setGuia(e.target.value); rastreo.reset() }}
          inputMode="numeric"
          aria-label="Número de guía"
          placeholder="Ej. 7200351240"
          className="tabular h-[52px] flex-[1_1_240px] rounded-md border border-line-strong bg-white px-4 text-base outline-none focus:border-primary-dark focus:shadow-[0_0_0_3px_rgba(40,168,224,0.4)]"
        />
        <button
          type="submit"
          disabled={rastreo.isPending}
          className="flex h-[52px] items-center gap-2 rounded-md bg-primary px-[22px] font-display text-base font-bold tracking-[0.04em] text-white uppercase disabled:opacity-70"
        >
          <Icon name="search" size={18} />
          {rastreo.isPending ? 'Buscando…' : 'Rastrear'}
        </button>
      </form>
      {rastreo.isError && (
        <div className="mt-4">
          <AlertaError>No encontramos esa guía. Revisa el número e inténtalo de nuevo.</AlertaError>
        </div>
      )}
      {r && (
        <div className="mt-5 rounded-lg border border-line bg-white p-[clamp(18px,3vw,26px)]">
          <div className="flex flex-wrap justify-between gap-3 border-b border-line pb-4">
            <span>
              <span className="block text-xs font-semibold text-muted-2">Guía</span>
              <strong className="tabular text-lg">{r.numero_guia}</strong>
            </span>
            <span>
              <span className="block text-xs font-semibold text-muted-2">Ubicación actual</span>
              <strong>{r.ubicacion_actual}</strong>
            </span>
            <span className="self-center rounded-full bg-tint-2 px-3 py-[5px] text-[13px] font-bold text-primary">
              {ESTADO_ENVIO[r.estado_actual] ?? r.estado_actual}
            </span>
          </div>
          <ol className="m-0 mt-4 flex list-none flex-col p-0">
            {[...r.historial].reverse().map((ev, i) => (
              <li key={i} className="grid grid-cols-[20px_1fr] gap-3.5">
                <span className="flex flex-col items-center">
                  <span className={`mt-[3px] size-3.5 shrink-0 rounded-full ${i === 0 ? 'bg-primary-dark' : 'bg-line-strong'}`} />
                  <span className="min-h-6 w-0.5 flex-1 bg-line" />
                </span>
                <span className="pb-[18px]">
                  <strong className={`block text-[15px] ${i === 0 ? 'font-bold' : 'font-medium'}`}>{ev.evento}</strong>
                  <span className="text-[13px] text-muted-2">{fmtFecha(ev.fecha)}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
      <p className="mt-5 mb-0 text-sm text-muted">
        ¿Tienes cuenta? Tus guías también aparecen en{' '}
        <Link to="/cuenta/pedidos" className="font-bold text-primary-dark">
          Mis pedidos
        </Link>
        .
      </p>
    </div>
  )
}
