import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Migas } from '../components/ui/basicos'
import { Icon } from '../components/ui/Icon'

function Pregunta({ titulo, children, abierta = false }: { titulo: string; children: ReactNode; abierta?: boolean }) {
  return (
    <details open={abierta} className="group border-b border-line last:border-b-0">
      <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 px-[18px] py-3 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
        {titulo}
        <span className="flex text-primary transition-transform duration-200 group-open:rotate-180">
          <Icon name="chevron-down" size={22} />
        </span>
      </summary>
      <div className="px-[18px] pb-[18px] text-sm leading-relaxed text-muted">{children}</div>
    </details>
  )
}

export default function Ayuda() {
  return (
    <div className="mx-auto max-w-[820px] px-[clamp(16px,4vw,32px)] pt-[18px]">
      <Migas items={[{ label: 'Inicio', to: '/' }, { label: 'Ayuda para comprar' }]} />
      <h1 className="m-0 mt-4 font-display text-[clamp(24px,3.4vw,34px)] font-bold text-ink">Te ayudamos a comprar</h1>
      <p className="m-0 mt-2 text-[15px] text-muted">Las respuestas a lo que más nos preguntan antes de pedir.</p>

      <div className="mt-6 overflow-hidden rounded-lg border border-line bg-white">
        <Pregunta titulo="¿Necesito una cuenta para comprar?" abierta>
          Puedes explorar el catálogo y armar tu carrito sin cuenta. Para finalizar la compra debes{' '}
          <Link to="/ingresar">ingresar</Link> o <Link to="/registro">crear una cuenta</Link>; tu carrito se conserva.
        </Pregunta>
        <Pregunta titulo="¿Cómo veo mi precio de técnico o distribuidor?">
          Crea tu cuenta como técnico o distribuidor (con tu documento o NIT y el nombre de tu empresa) e inicia sesión. Los precios del
          catálogo, la ficha y el carrito se actualizan a tu nivel y te mostramos el ahorro frente al precio público.
        </Pregunta>
        <Pregunta titulo="¿Qué medios de pago puedo usar?">
          Pago en línea con Wompi (tarjeta, PSE o Nequi) o pago contraentrega, cuando recibes tu pedido. Los medios disponibles en
          línea se muestran dentro de Wompi.
        </Pregunta>
        <Pregunta titulo="¿Cómo cotizo el envío?">
          En la ficha de cada producto puedes cotizar el envío con Coordinadora a tu departamento y ciudad. En el checkout el valor se
          calcula con el peso de todo tu carrito. El valor es estimado hasta confirmar el pedido.
        </Pregunta>
        <Pregunta titulo="¿Cómo rastreo mi pedido?">
          Cuando tu pedido se despacha le asignamos un número de guía de Coordinadora. Lo ves en el detalle del pedido y puedes
          consultarlo en <Link to="/rastreo">Rastrear pedido</Link>.
        </Pregunta>
        <Pregunta titulo="Cerré la ventana de pago, ¿perdí mi pedido?">
          No. Tu pedido se conserva como pendiente de pago. Abre <Link to="/cuenta/pedidos">Mis pedidos</Link>, entra al pedido y usa
          "Pagar ahora" para continuar.
        </Pregunta>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-white p-[18px]">
        <span className="flex text-primary">
          <Icon name="support_agent" size={28} />
        </span>
        <span className="min-w-0 flex-1 text-sm text-muted">
          <strong className="text-ink">¿Buscas algo puntual?</strong> Explora el catálogo por categoría o busca por referencia.
        </span>
        <Link to="/productos" className="text-sm font-bold">
          Ir al catálogo
        </Link>
      </div>
    </div>
  )
}
