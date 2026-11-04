import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

/** Ventana modal con <dialog>: atrapa el foco, cierra con Escape y al hacer clic fuera. */
export function Modal({
  abierto,
  titulo,
  onCerrar,
  children,
  ancho = 'max-w-[560px]',
}: {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: ReactNode
  ancho?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (abierto && !d.open) d.showModal()
    if (!abierto && d.open) d.close()
  }, [abierto])

  return (
    <dialog
      ref={ref}
      aria-labelledby="mc-modal-t"
      onCancel={(e) => {
        e.preventDefault()
        onCerrar()
      }}
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
      className={`m-auto max-h-[90dvh] w-[calc(100%-2rem)] ${ancho} rounded-lg border border-line bg-white p-0 text-ink shadow-[0_20px_60px_rgba(10,25,40,0.3)] backdrop:bg-[rgba(10,25,40,0.45)]`}
    >
      {abierto && (
        <>
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-white py-3 pr-3 pl-5">
            <h2 id="mc-modal-t" className="m-0 font-display text-lg font-bold">
              {titulo}
            </h2>
            <button type="button" onClick={onCerrar} aria-label="Cerrar" className="grid size-11 place-items-center rounded-md hover:bg-line-2">
              <Icon name="x" size={22} />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </>
      )}
    </dialog>
  )
}
