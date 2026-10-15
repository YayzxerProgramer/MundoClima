import { useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Clock3, XCircle } from "lucide-react";
import { getOrder } from "../../orders/api/orders";
import { confirmedPayment, orderLabels } from "../../orders/types";
import { openPayment } from "../api/wompi";
import { usePendingOrder } from "../hooks/pending-order";
import { SEO } from "../../../shared/ui/SEO";
import { Button, ErrorState, LinkButton, Skeleton } from "../../../shared/ui";
import { errorMessage } from "../../../shared/lib/api";
import { money } from "../../../shared/lib/format";
export default function PaymentResultPage() {
  const { id = "" } = useParams(),
    [params, setParams] = useSearchParams(),
    started = useRef(false);
  const order = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder(id),
    refetchInterval: (query) =>
      !query.state.error &&
      query.state.data?.status === "PENDIENTE_PAGO" &&
      query.state.dataUpdateCount < 30
        ? 2500
        : false,
  });
  const payment = useMutation({
    mutationFn: () =>
      openPayment(id, () => {
        void order.refetch();
      }),
  });
  const start = payment.mutate;
  useEffect(() => {
    if (
      order.data?.status === "PENDIENTE_PAGO" &&
      params.get("iniciar") === "1" &&
      !started.current
    ) {
      started.current = true;
      start();
      setParams({}, { replace: true });
    }
  }, [order.data?.status, params, setParams, start]);
  useEffect(() => {
    if (
      order.data &&
      order.data.status !== "PENDIENTE_PAGO" &&
      usePendingOrder.getState().pending?.orderId === id
    )
      usePendingOrder.getState().setPending(null);
  }, [order.data, id]);
  if (order.isError)
    return (
      <div className="container-site page-section">
        <ErrorState error={order.error} retry={() => void order.refetch()} />
      </div>
    );
  if (!order.data)
    return (
      <div className="container-site page-section">
        <Skeleton className="mx-auto h-96 max-w-2xl" />
      </div>
    );
  const data = order.data,
    confirmed = confirmedPayment(data.status),
    cash = data.status === "CONFIRMADO_CONTRAENTREGA",
    cancelled = data.status === "CANCELADO";
  return (
    <div className="container-site page-section">
      <SEO title="Estado de tu pedido" noIndex />
      <section className="result-card card">
        <span
          className={
            cancelled
              ? "result-icon result-error"
              : confirmed || cash
                ? "result-icon"
                : "result-icon result-pending"
          }
        >
          {cancelled ? (
            <XCircle size={32} />
          ) : confirmed || cash ? (
            <Check size={32} />
          ) : (
            <Clock3 size={32} />
          )}
        </span>
        <p className="eyebrow">{data.reference}</p>
        <h1>
          {confirmed
            ? "¡Tu pago está confirmado!"
            : cash
              ? "¡Recibimos tu pedido!"
              : cancelled
                ? "El pago no se completó"
                : "Tu pedido está creado"}
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted">
          {confirmed
            ? "Gracias por elegir Mundo Clima. Puedes consultar los detalles y seguir el estado de tu compra."
            : cash
              ? "Tu compra está confirmada para pago contraentrega. Consulta los detalles de tu pedido."
              : cancelled
                ? "Tu pedido aparece cancelado. Revisa sus detalles antes de realizar una nueva compra."
                : "El pago todavía está pendiente de confirmación. Consultamos el estado directamente con la tienda."}
        </p>
        <div className="my-7 grid gap-3 rounded-control bg-canvas p-5 text-left">
          <div className="summary-row">
            <span>Estado</span>
            <strong>{orderLabels[data.status]}</strong>
          </div>
          <div className="summary-row">
            <span>Envío registrado</span>
            <strong>{money(data.shipping)}</strong>
          </div>
          <div className="summary-row">
            <span>Total del pedido</span>
            <strong className="text-lg">{money(data.total)}</strong>
          </div>
        </div>
        {payment.isError && (
          <p role="alert" className="form-error mb-4">
            {errorMessage(payment.error)}
          </p>
        )}
        {data.status === "PENDIENTE_PAGO" && (
          <div className="mb-5 grid gap-3">
            <Button
              variant="buy"
              loading={payment.isPending}
              onClick={() => payment.mutate()}
            >
              Continuar pago con Wompi
            </Button>
            <Button
              variant="outline"
              loading={order.isFetching}
              onClick={() => void order.refetch()}
            >
              Consultar estado del pago
            </Button>
            <p className="text-xs leading-5 text-muted">
              Si cerraste la ventana de pago, puedes abrirla de nuevo. Este
              pedido se conserva.
            </p>
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <LinkButton to={`/cuenta/pedidos/${data.id}`}>
            Ver mi pedido
          </LinkButton>
          <LinkButton variant="outline" to="/productos">
            Volver a la tienda
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
