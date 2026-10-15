import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { pedirFirmaWompi } from '../api/cuenta'
import { mensajeError } from '../lib/api'
import { useAuth } from '../store/auth'
import type { Orden } from '../types/api'

interface WidgetConfig {
  currency: string
  amountInCents: number
  reference: string
  publicKey: string
  signature: { integrity: string }
  redirectUrl?: string
  customerData?: { email?: string; fullName?: string; phoneNumber?: string; phoneNumberPrefix?: string }
}
interface WidgetResultado {
  transaction?: { id: string; status: string; reference: string }
}
declare global {
  interface Window {
    WidgetCheckout?: new (c: WidgetConfig) => { open: (cb: (r: WidgetResultado) => void) => void }
  }
}

const SCRIPT = 'https://checkout.wompi.co/widget.js'
let cargando: Promise<void> | null = null

function cargarWidget() {
  if (window.WidgetCheckout) return Promise.resolve()
  cargando ??= new Promise<void>((ok, fail) => {
    const s = document.createElement('script')
    s.src = SCRIPT
    s.async = true
    s.onload = () => ok()
    s.onerror = () => { cargando = null; fail(new Error('No se pudo cargar el widget de Wompi')) }
    document.head.appendChild(s)
  })
  return cargando
}

export interface EstadoPago {
  referencia: string
  error: string | null
}

/**
 * GET /pagos/wompi/firma/:ordenId → widget de Wompi.
 * El resultado del widget no se toma como definitivo: la página de resultado consulta
 * GET /ordenes/:id hasta que el webhook de Wompi actualice el estado.
 */
export function usePagoWompi() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [estado, setEstado] = useState<EstadoPago | null>(null)

  const pagar = async (orden: Pick<Orden, 'id' | 'referencia' | 'direccion_envio'>) => {
    setEstado({ referencia: orden.referencia, error: null })
    try {
      const [firma] = await Promise.all([pedirFirmaWompi(orden.id), cargarWidget()])
      if (!window.WidgetCheckout) throw new Error('El widget de Wompi no está disponible')
      const usuario = useAuth.getState().usuario
      const resultado = `/pedidos/${orden.id}/resultado`
      const widget = new window.WidgetCheckout({
        currency: firma.moneda,
        amountInCents: firma.montoEnCentavos,
        reference: firma.referencia,
        publicKey: firma.publicKey,
        signature: { integrity: firma.firmaIntegridad },
        // Wompi exige https para volver después de PSE; en local se queda en el widget.
        ...(window.location.protocol === 'https:' ? { redirectUrl: `${window.location.origin}${resultado}` } : {}),
        customerData: {
          email: usuario?.email ?? firma.orden.cliente_email,
          fullName: usuario?.nombre_completo ?? firma.orden.cliente_nombre,
          phoneNumber: orden.direccion_envio.telefono_contacto.replace(/\D/g, '').slice(-10),
          phoneNumberPrefix: '+57',
        },
      })
      setEstado(null)
      widget.open((r) => {
        qc.invalidateQueries({ queryKey: ['orden', orden.id] })
        navigate(resultado, { state: { estadoWidget: r.transaction?.status ?? null, consultar: true } })
      })
    } catch (e) {
      setEstado({ referencia: orden.referencia, error: mensajeError(e, (e as Error).message) })
    }
  }

  return { pagar, estado, cerrar: () => setEstado(null) }
}
