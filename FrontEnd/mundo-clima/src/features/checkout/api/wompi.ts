import { z } from "zod";
import { api, ApiError, decimal } from "../../../shared/lib/api";
const signatureSchema = z.object({
  publicKey: z.string(),
  referencia: z.string(),
  montoEnCentavos: z.number().int().positive(),
  moneda: z.literal("COP"),
  firmaIntegridad: z.string(),
  orden: z.object({
    id: z.string(),
    referencia: z.string(),
    total: decimal,
    cliente_email: z.string(),
    cliente_nombre: z.string(),
  }),
});
interface WidgetOptions {
  currency: string;
  amountInCents: number;
  reference: string;
  publicKey: string;
  signature: { integrity: string };
  redirectUrl: string;
  customerData: { email: string; fullName: string };
}
declare global {
  interface Window {
    WidgetCheckout?: new (options: WidgetOptions) => {
      open: (callback: (result: unknown) => void) => void;
    };
  }
}
let widgetPromise: Promise<void> | undefined;
function loadWidget() {
  if (window.WidgetCheckout) return Promise.resolve();
  if (!widgetPromise)
    widgetPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.wompi.co/widget.js";
      script.async = true;
      const timeout = window.setTimeout(() => {
        script.remove();
        widgetPromise = undefined;
        reject(
          new ApiError(
            "Wompi tardó en responder. Tu pedido se conserva; puedes reintentar el pago.",
          ),
        );
      }, 15000);
      script.onload = () => {
        clearTimeout(timeout);
        if (window.WidgetCheckout) resolve();
        else {
          widgetPromise = undefined;
          script.remove();
          reject(
            new ApiError("No se pudo iniciar el pago. Intenta nuevamente."),
          );
        }
      };
      script.onerror = () => {
        clearTimeout(timeout);
        widgetPromise = undefined;
        script.remove();
        reject(
          new ApiError(
            "No pudimos conectar con Wompi. Tu pedido sigue disponible.",
          ),
        );
      };
      document.head.appendChild(script);
    });
  return widgetPromise;
}
export async function openPayment(orderId: string, onReturn: () => void) {
  const signed = signatureSchema.parse(
    (
      await api.get<unknown>(
        `/pagos/wompi/firma/${encodeURIComponent(orderId)}`,
      )
    ).data,
  );
  const configuredKey: string | undefined = import.meta.env
    .VITE_WOMPI_PUBLIC_KEY;
  if (!configuredKey || configuredKey !== signed.publicKey)
    throw new ApiError(
      "La configuración del pago no coincide. Tu pedido se conserva; contacta al administrador de la tienda.",
    );
  await loadWidget();
  if (!window.WidgetCheckout)
    throw new ApiError("El pago no está disponible por el momento.");
  new window.WidgetCheckout({
    currency: signed.moneda,
    amountInCents: signed.montoEnCentavos,
    reference: signed.referencia,
    publicKey: configuredKey,
    signature: { integrity: signed.firmaIntegridad },
    redirectUrl: `${window.location.origin}/checkout/resultado/${encodeURIComponent(orderId)}`,
    customerData: {
      email: signed.orden.cliente_email,
      fullName: signed.orden.cliente_nombre,
    },
  }).open(() => onReturn());
}
