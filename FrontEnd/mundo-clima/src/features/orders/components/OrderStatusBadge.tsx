import { Badge } from "../../../shared/ui";
import { orderLabels, type OrderStatus } from "../types";
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge
      tone={
        status === "CANCELADO"
          ? "danger"
          : status === "PENDIENTE_PAGO"
            ? "warning"
            : status === "EN_CAMINO"
              ? "blue"
              : "success"
      }
    >
      {orderLabels[status]}
    </Badge>
  );
}
