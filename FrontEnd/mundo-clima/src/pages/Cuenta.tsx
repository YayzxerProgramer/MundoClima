import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { useMisPedidos, usePerfil } from '../api/cuenta'
import { Skeleton } from '../components/ui/basicos'
import { Icon } from '../components/ui/Icon'
import { mensajeError } from '../lib/api'
import { ROL_LABEL, TAG_NIVEL } from '../lib/constantes'
import { fmt, fmtFecha, primerNombre } from '../lib/formato'
import { etiquetaEstado, unidadesOrden } from '../lib/orden'
import { useAuth } from '../store/auth'
import { useUI } from '../store/ui'

export default function Cuenta({ tab }: { tab: 'perfil' | 'pedidos' }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const guardado = useAuth((s) => s.usuario)
  const perfil = usePerfil()
  const u = perfil.data ?? guardado
  const pedidos = useMisPedidos()
  const nombre = primerNombre(u?.nombre_completo)
  const rolTag = u?.rol === 'TECNICO' || u?.rol === 'DISTRIBUIDOR' ? TAG_NIVEL[u.rol]! : ['#EEF1F4', '#16232F']

  const salir = () => {
    useAuth.getState().cerrarSesion()
    qc.removeQueries({ queryKey: ['mis-pedidos'] })
    qc.removeQueries({ queryKey: ['orden'] })
    navigate('/')
    useUI.getState().avisar('Cerraste sesión · ves precios públicos')
  }

  const filas: [string, string | null | undefined][] = [
    ['Nombre completo', u?.nombre_completo],
    ['Correo', u?.email],
    ['Celular', u?.telefono],
    ['Documento / NIT', u?.documento_identidad],
    ['Empresa', u?.nombre_empresa],
    ['Tipo de cuenta', u ? ROL_LABEL[u.rol] : null],
    ['Cliente desde', u?.creado_en ? fmtFecha(u.creado_en) : null],
  ]

  const tabs: ['perfil' | 'pedidos', string, string][] = [
    ['perfil', 'Perfil', '/cuenta'],
    ['pedidos', `Mis pedidos${pedidos.data ? ` (${pedidos.data.length})` : ''}`, '/cuenta/pedidos'],
  ]

  return (
    <div className="mx-auto max-w-[1080px] px-[clamp(16px,4vw,32px)] pt-[clamp(24px,4vw,40px)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="grid size-14 place-items-center rounded-full bg-tint font-display text-xl font-bold text-primary">
            {(nombre[0] ?? '?').toUpperCase()}
          </span>
          <div>
            <h1 className="m-0 font-display text-[clamp(22px,3vw,30px)] font-bold text-ink">Hola, {nombre}</h1>
            {u && (
              <span className="mt-1 inline-block rounded-full px-2.5 py-[3px] text-xs font-bold" style={{ background: rolTag[0], color: rolTag[1] }}>
                {ROL_LABEL[u.rol]}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={salir}
          className="flex h-11 items-center gap-2 rounded-md border border-line-strong bg-white px-4 font-bold hover:border-primary hover:text-err"
        >
          <Icon name="log-out" size={18} />
          Cerrar sesión
        </button>
      </div>
      <div role="tablist" aria-label="Mi cuenta" className="mt-6 flex gap-1 border-b border-line">
        {tabs.map(([k, label, to]) => (
          <Link
            key={k}
            to={to}
            role="tab"
            aria-selected={tab === k}
            className={`-mb-px flex h-[46px] items-center border-b-[3px] px-4 text-[15px] font-bold hover:no-underline ${tab === k ? 'border-primary text-primary' : 'border-transparent text-muted'}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {tab === 'perfil' ? (
        <div role="tabpanel" className="mt-5 overflow-hidden rounded-lg border border-b-0 border-line bg-white">
          {filas.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[minmax(130px,34%)_1fr] border-b border-line text-[15px]">
              <span className="bg-soft px-[18px] py-3.5 font-semibold text-ink-2">{k}</span>
              <span className="tabular px-[18px] py-3.5 [overflow-wrap:anywhere]">{v || '—'}</span>
            </div>
          ))}
        </div>
      ) : (
        <div role="tabpanel" className="mt-5 flex flex-col gap-3">
          {pedidos.isLoading &&
            Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[74px] rounded-lg" />)}
          {pedidos.isError && <p className="text-err">{mensajeError(pedidos.error)}</p>}
          {pedidos.data?.map((o) => {
            const [estado, bg, fg] = etiquetaEstado(o)
            return (
              <div key={o.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-line bg-white px-[18px] py-4">
                <div className="flex flex-[1_1_200px] flex-col gap-1">
                  <strong className="tabular break-all">{o.referencia}</strong>
                  <span className="text-[13px] text-muted-2">
                    {fmtFecha(o.creado_en)} · {unidadesOrden(o)}
                  </span>
                </div>
                <span className="rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap" style={{ background: bg, color: fg }}>
                  {estado}
                </span>
                <strong className="tabular min-w-[110px] text-right font-display font-bold">{fmt(o.total)}</strong>
                <Link
                  to={`/pedidos/${o.id}`}
                  className="flex h-10 items-center gap-1.5 rounded-[5px] border border-line-strong bg-white px-3.5 font-bold text-primary hover:no-underline"
                >
                  Ver detalle
                  <Icon name="chevron-right" size={16} />
                </Link>
              </div>
            )
          })}
          {pedidos.data?.length === 0 && (
            <div className="rounded-lg border border-dashed border-line-strong px-5 py-10 text-center text-muted">Aún no tienes pedidos.</div>
          )}
        </div>
      )}
    </div>
  )
}
