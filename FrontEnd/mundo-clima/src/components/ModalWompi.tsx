import type { EstadoPago } from '../hooks/wompi'
import { Spinner } from './ui/basicos'
import { Icon } from './ui/Icon'

/** Ventana mientras se pide la firma de integridad; después se abre el widget de Wompi encima. */
export function ModalWompi({ estado, onCerrar }: { estado: EstadoPago | null; onCerrar: () => void }) {
  if (!estado) return null
  return (
    <div className="fixed inset-0 z-95 grid place-items-center bg-[rgba(10,25,40,0.55)] p-4">
      <div role="dialog" aria-modal="true" aria-label="Pago en línea" className="w-[min(100%,440px)] overflow-hidden rounded-lg bg-white shadow-[0_30px_80px_-20px_rgba(10,25,40,0.5)]">
        <div className="flex items-center justify-between bg-primary py-4 pr-[18px] pl-[22px] text-white">
          <span>
            <strong className="block text-base">Pago en línea</strong>
            <span className="tabular text-[13px] text-[#C9D6E2]">Referencia {estado.referencia}</span>
          </span>
          <button type="button" onClick={onCerrar} aria-label="Cerrar pago" className="grid size-10 place-items-center rounded-[5px] bg-white/10 text-white">
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="flex flex-col gap-4 p-[22px]">
          {estado.error ? (
            <>
              <div role="alert" className="flex gap-2.5 rounded-md bg-err-bg px-3.5 py-3 text-sm font-semibold text-err-ink">
                <Icon name="circle-alert" size={18} />
                {estado.error}
              </div>
              <button type="button" onClick={onCerrar} className="h-[46px] rounded-md border border-line-strong bg-white font-bold text-primary">
                Cerrar
              </button>
            </>
          ) : (
            <div role="status" className="flex items-center justify-center gap-3 py-5 text-ink-2">
              <Spinner size={18} />
              Preparando pago seguro…
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
