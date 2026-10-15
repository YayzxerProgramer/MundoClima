import { Link } from "react-router-dom";
import { Accordion, Breadcrumbs } from "../../../shared/ui";
import { SEO } from "../../../shared/ui/SEO";
export default function HelpPage() {
  return (
    <div className="container-site pb-10">
      <SEO title="Te ayudamos a comprar" />
      <Breadcrumbs items={[{ label: "Ayuda para comprar" }]} />
      <div className="mx-auto max-w-2xl">
        <div className="page-heading">
          <div>
            <p className="eyebrow">COMPRA CON INFORMACIÓN CLARA</p>
            <h1>Te ayudamos a elegir</h1>
          </div>
        </div>
        <Accordion title="¿Necesito una cuenta para comprar?" defaultOpen>
          <p className="text-sm leading-7 text-muted">
            Sí. Puedes explorar libremente el catálogo y armar tu carrito. Para
            finalizar la compra debes{" "}
            <Link className="text-link" to="/login">
              ingresar
            </Link>{" "}
            o{" "}
            <Link className="text-link" to="/registro">
              crear una cuenta
            </Link>
            .
          </p>
        </Accordion>
        <Accordion title="¿Cómo consulto mi precio profesional?">
          <p className="text-sm leading-7 text-muted">
            Ingresa con tu cuenta de técnico o distribuidor. Cada producto
            muestra el precio disponible para tu nivel y, cuando existen, las
            tarifas informadas por volumen.
          </p>
        </Accordion>
        <Accordion title="¿Qué medios de pago puedo utilizar?">
          <p className="text-sm leading-7 text-muted">
            Puedes elegir pago en línea con Wompi (tarjetas, PSE y Nequi) o
            contraentrega. La disponibilidad final de los medios en línea se
            muestra dentro de Wompi.
          </p>
        </Accordion>
        <Accordion title="¿Cómo cotizo y consulto el envío?">
          <p className="text-sm leading-7 text-muted">
            En la ficha del producto y durante el checkout puedes cotizar el
            envío a tu ciudad cuando se dispone del peso del producto. El valor
            es estimado. Una vez tengas una guía, consulta{" "}
            <Link to="/rastreo" className="text-link">
              el rastreo
            </Link>
            .
          </p>
        </Accordion>
        <Accordion title="Cerré la ventana de pago, ¿perdí mi pedido?">
          <p className="text-sm leading-7 text-muted">
            Tu pedido se conserva. Abre{" "}
            <Link to="/cuenta/pedidos" className="text-link">
              mis pedidos
            </Link>{" "}
            y consulta su estado. Si está pendiente, podrás continuar el pago
            desde el mismo pedido.
          </p>
        </Accordion>
      </div>
    </div>
  );
}
