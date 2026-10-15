import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { getAdminOrders } from "../../orders/api/orders";
import { orderLabels } from "../../orders/types";
import { OrderStatusBadge } from "../../orders/components/OrderStatusBadge";
import {
  EmptyState,
  ErrorState,
  Field,
  Input,
  Pagination,
  Select,
  Skeleton,
} from "../../../shared/ui";
import { SEO } from "../../../shared/ui/SEO";
import { date, money } from "../../../shared/lib/format";
export default function AdminOrdersPage() {
  const [params, setParams] = useSearchParams(),
    from = params.get("desde") ?? "",
    to = params.get("hasta") ?? "",
    valid = !(from && to && from > to);
  const page = Math.max(1, Number(params.get("pagina")) || 1),
    filters = {
      pagina: String(page),
      limite: "10",
      ...(params.get("estado") ? { estado: params.get("estado")! } : {}),
      ...(from ? { desde: `${from}T00:00:00-05:00` } : {}),
      ...(to ? { hasta: `${to}T23:59:59.999-05:00` } : {}),
    };
  const query = useQuery({
    queryKey: ["admin-orders", filters],
    queryFn: () => getAdminOrders(filters),
    enabled: valid,
  });
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.delete("pagina");
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }
  return (
    <>
      <SEO title="Administrar pedidos" noIndex />
      <div className="page-heading">
        <div>
          <p className="eyebrow">OPERACIÓN DE LA TIENDA</p>
          <h1>Pedidos</h1>
        </div>
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Field id="order-status" label="Estado">
          <Select
            id="order-status"
            value={params.get("estado") ?? ""}
            onChange={(event) => update("estado", event.target.value)}
          >
            <option value="">Todos los estados</option>
            {Object.entries(orderLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="orders-from" label="Desde">
          <Input
            id="orders-from"
            type="date"
            value={from}
            onChange={(event) => update("desde", event.target.value)}
          />
        </Field>
        <Field id="orders-to" label="Hasta">
          <Input
            id="orders-to"
            type="date"
            min={from}
            value={to}
            onChange={(event) => update("hasta", event.target.value)}
          />
        </Field>
      </div>
      {!valid ? (
        <p className="form-error">
          La fecha final debe ser posterior a la inicial.
        </p>
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Skeleton className="h-80" />
      ) : !query.data.orders.length ? (
        <EmptyState
          title="No hay pedidos con estos filtros"
          description="Prueba otro estado o rango de fechas."
        />
      ) : (
        <>
          <div className="data-table-wrap bg-surface">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Referencia</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {query.data.orders.map((order) => (
                  <tr key={order.id}>
                    <td className="text-xs">{order.reference}</td>
                    <td>{order.customer?.name ?? "Cliente"}</td>
                    <td className="whitespace-nowrap text-xs">
                      {date(order.createdAt)}
                    </td>
                    <td>
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="whitespace-nowrap tabular-nums">
                      {money(order.total)}
                    </td>
                    <td>
                      <Link
                        to={`/cuenta/pedidos/${order.id}`}
                        className="text-link text-xs"
                      >
                        Ver pedido
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={query.data.meta.pagina}
            pages={query.data.meta.totalPaginas}
            onChange={(value) => {
              const next = new URLSearchParams(params);
              next.set("pagina", String(value));
              setParams(next);
            }}
          />
        </>
      )}
    </>
  );
}
