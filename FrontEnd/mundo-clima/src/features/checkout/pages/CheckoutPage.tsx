import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Banknote, LockKeyhole, MapPin } from "lucide-react";
import { useCartDetails } from "../../cart/hooks/use-cart";
import { useCart } from "../../cart/hooks/store";
import { useSession } from "../../auth/hooks/session";
import { createOrder } from "../../orders/api/orders";
import { usePendingOrder } from "../hooks/pending-order";
import { quoteShipping } from "../api/shipping";
import { SEO } from "../../../shared/ui/SEO";
import {
  Breadcrumbs,
  Button,
  EmptyState,
  Field,
  Input,
  LinkButton,
  ProductImage,
  Select,
  Skeleton,
} from "../../../shared/ui";
import { ApiError, errorMessage } from "../../../shared/lib/api";
import { money } from "../../../shared/lib/format";
import { DEPARTAMENTOS } from "../../../shared/lib/colombia";
import { queryClient } from "../../../shared/lib/query";
const schema = z.object({
  calle: z.string().trim().min(5, "Escribe una dirección completa"),
  ciudad: z.string().trim().min(2, "Escribe tu ciudad"),
  departamento: z.string().trim().min(2, "Selecciona tu departamento"),
  telefono_contacto: z
    .string()
    .trim()
    .regex(/^[+\d ()-]{7,20}$/, "Escribe un teléfono de contacto válido"),
  metodo_pago: z.enum(["WOMPI", "CONTRAENTREGA"]),
});
type Fields = z.infer<typeof schema>;
export default function CheckoutPage() {
  const cart = useCartDetails(),
    user = useSession((state) => state.user)!,
    navigate = useNavigate(),
    { pending, setPending } = usePendingOrder(),
    [uncertain, setUncertain] = useState(false),
    [step, setStep] = useState(1);
  const form = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: {
      calle: "",
      ciudad: "",
      departamento: "",
      telefono_contacto: user.phone ?? "",
      metodo_pago: "WOMPI",
    },
  });
  const quote = useMutation({
    mutationFn: (values: Fields) =>
      quoteShipping({
        ciudad_destino: values.ciudad,
        departamento_destino: values.departamento,
        peso_total_kg: cart.weight,
        valor_declarado: cart.subtotal,
      }),
  });
  const mutation = useMutation({
    mutationFn: async (values: Fields) => {
      const fresh = await cart.refetch();
      if (
        fresh.some(
          (result, index) =>
            !result.data ||
            result.isError ||
            !result.data.active ||
            result.data.stock < cart.lines[index].quantity,
        )
      )
        throw new ApiError(
          "Cambió la disponibilidad de tu carrito. Revisa las cantidades antes de continuar.",
        );
      if (fresh.some((result, index) => result.data?.price !== cart.lines[index].product?.price))
        throw new ApiError("Cambió el precio de un producto. Revisa el total actualizado y confirma nuevamente.");
      return createOrder({
        items: cart.lines.map((line) => ({
          producto_id: line.productId,
          cantidad: line.quantity,
        })),
        metodo_pago: values.metodo_pago,
        direccion_envio: {
          calle: values.calle,
          ciudad: values.ciudad,
          departamento: values.departamento,
          telefono_contacto: values.telefono_contacto,
        },
      });
    },
    retry: false,
    onSuccess: (order) => {
      setPending({ userId: user.id, orderId: order.id });
      useCart.getState().clear();
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      navigate(
        `/checkout/resultado/${order.id}${order.paymentMethod === "WOMPI" ? "?iniciar=1" : ""}`,
        { replace: true },
      );
    },
    onError: (error) => {
      if (
        error instanceof ApiError &&
        error.status === 0 &&
        !error.message.startsWith("Cambió")
      )
        setUncertain(true);
    },
  });
  const errors = form.formState.errors;
  if (pending?.userId === user.id)
    return (
      <div className="container-site page-section">
        <SEO title="Continúa tu pedido" noIndex />
        <EmptyState
          title="Tienes un pedido creado"
          description="Continúa con ese pedido para revisar su estado o completar el pago."
        >
          <LinkButton to={`/checkout/resultado/${pending.orderId}`}>
            Ver mi pedido
          </LinkButton>
          <Button variant="ghost" onClick={() => setPending(null)}>
            Volver a mi carrito
          </Button>
        </EmptyState>
      </div>
    );
  if (!cart.lines.length)
    return (
      <div className="container-site page-section">
        <EmptyState
          title="Tu carrito está vacío"
          description="Agrega productos antes de continuar con tu compra."
        >
          <LinkButton to="/productos">Explorar catálogo</LinkButton>
        </EmptyState>
      </div>
    );
  return (
    <div className="container-site pb-10">
      <SEO title="Finalizar compra" noIndex />
      <Breadcrumbs
        items={[
          { label: "Mi carrito", to: "/carrito" },
          { label: "Finalizar compra" },
        ]}
      />
      <div className="page-heading">
        <div>
          <p className="eyebrow">UN PASO MÁS CERCA</p>
          <h1>Finaliza tu compra</h1>
          <p>
            Hola, {user.name.split(" ")[0]}. Vamos a llevar tu proyecto al
            siguiente nivel.
          </p>
        </div>
        <span className="flex items-center gap-2 text-xs text-muted">
          <LockKeyhole size={16} /> Compra con tu cuenta
        </span>
      </div>
      <div className="checkout-layout">
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <div className="checkout-steps">
            <span className={step === 1 ? "active" : ""}>01 Dirección</span>
            <span className={step === 2 ? "active" : ""}>
              02 Pago y confirmación
            </span>
          </div>
          <div className="card p-5 md:p-7" hidden={step !== 1}>
            <h2 className="mb-6 flex items-center gap-2 text-lg">
              <MapPin size={21} /> ¿Dónde recibes tu pedido?
            </h2>
            <div className="grid gap-5">
              <Field
                id="address"
                label="Dirección completa"
                error={errors.calle?.message}
              >
                <Input
                  id="address"
                  autoComplete="street-address"
                  placeholder="Calle, número, apartamento o local"
                  {...form.register("calle")}
                  aria-invalid={!!errors.calle}
                />
              </Field>
              <div className="form-grid">
                <Field
                  id="department"
                  label="Departamento"
                  error={errors.departamento?.message}
                >
                  <Select
                    id="department"
                    autoComplete="address-level1"
                    {...form.register("departamento")}
                    aria-invalid={!!errors.departamento}
                  >
                    <option value="">Selecciona…</option>
                    {DEPARTAMENTOS.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </Select>
                </Field>
                <Field id="city" label="Ciudad" error={errors.ciudad?.message}>
                  <Input
                    id="city"
                    autoComplete="address-level2"
                    {...form.register("ciudad")}
                    aria-invalid={!!errors.ciudad}
                  />
                </Field>
              </div>
              <Field
                id="contact-phone"
                label="Teléfono de contacto"
                error={errors.telefono_contacto?.message}
              >
                <Input
                  id="contact-phone"
                  type="tel"
                  autoComplete="tel"
                  {...form.register("telefono_contacto")}
                  aria-invalid={!!errors.telefono_contacto}
                />
              </Field>
              <Button
                loading={quote.isPending}
                onClick={async () => {
                  if (
                    await form.trigger([
                      "calle",
                      "ciudad",
                      "departamento",
                      "telefono_contacto",
                    ])
                  ) {
                    if (
                      cart.weight >= 0.1 &&
                      !cart.lines.some(
                        (line) => !line.product || line.product.weight <= 0,
                      )
                    )
                      quote.mutate(form.getValues());
                    setStep(2);
                  }
                }}
              >
                Continuar al pago
              </Button>
            </div>
          </div>
          <div className="card p-5 md:p-7" hidden={step !== 2}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg">Elige cómo pagar</h2>
              <Button
                variant="ghost"
                className="btn-sm"
                onClick={() => setStep(1)}
              >
                Editar dirección
              </Button>
            </div>
            <p className="mb-6 rounded-control bg-canvas p-4 text-sm leading-6">
              {form.getValues("calle")}
              <br />
              {form.getValues("ciudad")}, {form.getValues("departamento")}
              <br />
              {form.getValues("telefono_contacto")}
            </p>
            <div className="grid gap-3">
              <label className="payment-option">
                <input
                  type="radio"
                  value="WOMPI"
                  {...form.register("metodo_pago")}
                />
                <CreditCard size={24} />
                <span>
                  <strong>Pagar en línea</strong>
                  <small>Tarjeta, PSE y Nequi · Wompi</small>
                </span>
              </label>
              <label className="payment-option">
                <input
                  type="radio"
                  value="CONTRAENTREGA"
                  {...form.register("metodo_pago")}
                />
                <Banknote size={24} />
                <span>
                  <strong>Contraentrega</strong>
                  <small>Paga cuando recibas tu pedido</small>
                </span>
              </label>
            </div>
            {quote.isPending && (
              <p className="mt-5 text-sm text-muted">
                Consultando estimación de envío…
              </p>
            )}
            {quote.data && (
              <div className="mt-5 rounded-control bg-primary/5 p-4 text-sm">
                <strong>Envío estimado: {money(quote.data.total_flete)}</strong>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Aproximadamente {quote.data.dias_entrega_estimados} días. Esta
                  cotización se muestra por separado: el valor confirmado será
                  el que registre tu pedido.
                </p>
              </div>
            )}
            {quote.isError && (
              <p className="mt-5 text-sm text-warning">
                No pudimos cotizar el envío. El valor está pendiente de
                confirmación.
              </p>
            )}
            {cart.weight < 0.1 && (
              <p className="mt-5 text-sm text-muted">
                El envío queda por confirmar porque falta el peso de los
                productos.
              </p>
            )}
            <p className="my-5 text-xs leading-6 text-muted">
              Al continuar se crea tu pedido y se reserva su inventario.
              Verifica los productos y la dirección antes de confirmar.
            </p>
            {mutation.isError && (
              <p role="alert" className="form-error mb-4">
                {errorMessage(mutation.error)}
              </p>
            )}
            {uncertain ? (
              <div className="form-error">
                <p>
                  No pudimos confirmar si se creó el pedido. Revisa tus pedidos
                  antes de intentarlo de nuevo.
                </p>
                <Link to="/cuenta/pedidos" className="text-link mt-3">
                  Consultar mis pedidos
                </Link>
              </div>
            ) : (
              <Button
                variant="buy"
                type="submit"
                className="w-full"
                loading={mutation.isPending}
                disabled={cart.loading || cart.invalid}
              >
                Crear pedido y continuar
              </Button>
            )}
            {cart.invalid && !cart.loading && (
              <p className="mt-3 text-sm text-danger">
                Hay productos que necesitan revisión.{" "}
                <Link to="/carrito" className="underline">
                  Volver al carrito
                </Link>
              </p>
            )}
          </div>
        </form>
        <aside className="card h-fit p-5 md:p-7">
          <h2 className="mb-5 text-lg">Tu pedido</h2>
          <div className="grid gap-4">
            {cart.lines.map((line) =>
              line.product ? (
                <div className="flex items-start gap-3" key={line.productId}>
                  <ProductImage
                    src={line.product.images[0]}
                    alt=""
                    className="h-14 w-14 rounded bg-white object-contain"
                  />
                  <div className="flex-1 text-xs">
                    <p className="line-clamp-2 font-medium">
                      {line.product.name}
                    </p>
                    <p className="mt-2 text-muted">
                      {line.quantity} × {money(line.product.price)}
                    </p>
                  </div>
                </div>
              ) : (
                <Skeleton key={line.productId} className="h-16" />
              ),
            )}
          </div>
          <div className="summary-row mt-6 border-t pt-5">
            <span>Subtotal</span>
            <strong>
              {cart.loading ? "Consultando…" : money(cart.subtotal)}
            </strong>
          </div>
          <div className="summary-row mt-3 text-muted">
            <span>Envío</span>
            <span>Por confirmar</span>
          </div>
          <p className="mt-5 text-xs leading-6 text-muted">
            El total definitivo se mostrará con la confirmación del pedido.
          </p>
        </aside>
      </div>
    </div>
  );
}
