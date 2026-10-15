import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Truck } from "lucide-react";
import { getOrder } from "../api/orders";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import {
  Breadcrumbs,
  ErrorState,
  LinkButton,
  Skeleton,
} from "../../../shared/ui";
import { SEO } from "../../../shared/ui/SEO";
import { date, money } from "../../../shared/lib/format";
export default function OrderDetailPage() {
  const { id = "" } = useParams(),
    query = useQuery({ queryKey: ["order", id], queryFn: () => getOrder(id) });
  if (query.isError)
    return (
      <div className="container-site page-section">
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      </div>
    );
  if (!query.data)
    return (
      <div className="container-site page-section">
        <Skeleton className="h-96" />
      </div>
    );
  const order = query.data;
  return (
    <div className="container-site pb-10">
      <SEO title={`Pedido ${order.reference}`} noIndex />
      <Breadcrumbs
        items={[
          { label: "Mis pedidos", to: "/cuenta/pedidos" },
          { label: order.reference },
        ]}
      />
      <div className="page-heading">
        <div>
          <p className="eyebrow">DETALLE DEL PEDIDO</p>
          <h1 className="break-all text-2xl md:text-3xl">{order.reference}</h1>
          <p>Realizado el {date(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="checkout-layout">
        <section className="card p-5 md:p-7">
          <h2 className="mb-5 text-lg">Tus productos</h2>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="min-w-40">{item.name}</td>
                    <td>{item.quantity}</td>
                    <td className="whitespace-nowrap tabular-nums">
                      {money(item.unitPrice)}
                    </td>
                    <td className="whitespace-nowrap font-semibold tabular-nums">
                      {money(item.unitPrice * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {order.guide && (
            <div className="mt-6 rounded-control bg-primary/5 p-5">
              <h3 className="flex items-center gap-2 text-sm">
                <Truck size={19} /> Tu envío
              </h3>
              <p className="my-3 text-sm">
                Guía {order.guide} · {order.shippingStatus ?? "En preparación"}
              </p>
              <LinkButton
                variant="outline"
                to={`/rastreo?guia=${encodeURIComponent(order.guide)}`}
              >
                Seguir envío
              </LinkButton>
            </div>
          )}
        </section>
        <aside className="card h-fit p-6">
          <h2 className="mb-4 text-lg">Entrega y pago</h2>
          <address className="text-sm not-italic leading-7 text-muted">
            {order.address.calle}
            <br />
            {order.address.ciudad}, {order.address.departamento}
            <br />
            {order.address.telefono_contacto}
          </address>
          <p className="my-5 text-sm">
            {order.paymentMethod === "WOMPI"
              ? "Pago en línea con Wompi"
              : "Pago contraentrega"}
          </p>
          <div className="grid gap-3 border-t pt-4">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{money(order.subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Envío registrado</span>
              <span>{money(order.shipping)}</span>
            </div>
            <div className="summary-row border-t pt-3 font-bold">
              <span>Total</span>
              <span>{money(order.total)}</span>
            </div>
          </div>
          {order.status === "PENDIENTE_PAGO" && (
            <LinkButton
              variant="buy"
              className="mt-5 w-full"
              to={`/checkout/resultado/${order.id}`}
            >
              Continuar pago
            </LinkButton>
          )}
        </aside>
      </div>
    </div>
  );
}
