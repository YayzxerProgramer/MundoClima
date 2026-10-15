import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { ArrowUpRight, Package } from "lucide-react";
import { getOrders } from "../api/orders";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import {
  Breadcrumbs,
  EmptyState,
  ErrorState,
  LinkButton,
  Skeleton,
} from "../../../shared/ui";
import { SEO } from "../../../shared/ui/SEO";
import { date, money } from "../../../shared/lib/format";
import { useSession } from "../../auth/hooks/session";
export default function OrdersPage() {
  const user = useSession((state) => state.user),
    query = useQuery({ queryKey: ["orders", user?.id], queryFn: getOrders });
  return (
    <div className="container-site pb-10">
      <SEO title="Mis pedidos" noIndex />
      <Breadcrumbs
        items={[
          { label: "Mi cuenta", to: "/cuenta" },
          { label: "Mis pedidos" },
        ]}
      />
      <div className="page-heading">
        <div>
          <p className="eyebrow">CADA PROYECTO TIENE UNA HISTORIA</p>
          <h1>Mis pedidos</h1>
          <p>Tus compras y su estado, en un solo lugar.</p>
        </div>
      </div>
      {query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Skeleton className="h-72" />
      ) : !query.data.length ? (
        <EmptyState
          title="Tu primera compra está por llegar"
          description="Cuando hagas un pedido, podrás encontrar todos sus detalles aquí."
        >
          <LinkButton to="/productos">Explorar productos</LinkButton>
        </EmptyState>
      ) : (
        <div className="grid gap-4">
          {query.data.map((order) => (
            <article className="order-card card" key={order.id}>
              <Package size={26} className="hidden text-primary md:block" />
              <div className="flex-1">
                <h2 className="text-sm">{order.reference}</h2>
                <p className="mt-2 text-xs text-muted">
                  {date(order.createdAt)} ·{" "}
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                  unidades
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
              <strong className="tabular-nums">{money(order.total)}</strong>
              <Link
                className="text-link text-xs"
                to={`/cuenta/pedidos/${order.id}`}
              >
                Ver detalle <ArrowUpRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
