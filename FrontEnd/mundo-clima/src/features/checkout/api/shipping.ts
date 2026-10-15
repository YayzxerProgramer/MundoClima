import { z } from "zod";
import { api, decimal } from "../../../shared/lib/api";
export const quoteSchema = z.object({
  transportadora: z.string(),
  flete_base: decimal,
  costo_manejo: decimal,
  total_flete: decimal,
  dias_entrega_estimados: z.number(),
  ciudad_origen: z.string(),
  ciudad_destino: z.string(),
});
export type ShippingQuote = z.infer<typeof quoteSchema>;
export const quoteShipping = async (body: {
  departamento_destino: string;
  ciudad_destino: string;
  peso_total_kg: number;
  valor_declarado?: number;
}) =>
  quoteSchema.parse((await api.post<unknown>("/envios/cotizar", body)).data);
export const trackingSchema = z.object({
  numero_guia: z.string(),
  transportadora: z.string(),
  estado_actual: z.string(),
  ubicacion_actual: z.string(),
  historial: z.array(z.object({ fecha: z.string(), evento: z.string() })),
});
export const trackShipment = async (guide: string) =>
  trackingSchema.parse(
    (await api.get<unknown>(`/envios/rastreo/${encodeURIComponent(guide)}`))
      .data,
  );
