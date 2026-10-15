import { z } from "zod";
import { api, decimal } from "../../../shared/lib/api";
import type { NewOrder, Order } from "../types";
const schema = z.object({
  id: z.string(),
  referencia: z.string(),
  estado: z.enum([
    "PENDIENTE_PAGO",
    "PAGADO",
    "CONFIRMADO_CONTRAENTREGA",
    "EN_CAMINO",
    "ENTREGADO",
    "CANCELADO",
  ]),
  metodo_pago: z.enum(["WOMPI", "CONTRAENTREGA"]),
  subtotal: decimal,
  costo_envio: decimal,
  total: decimal,
  direccion_envio: z.object({
    calle: z.string(),
    ciudad: z.string(),
    departamento: z.string(),
    telefono_contacto: z.string(),
  }),
  items: z
    .array(
      z.object({
        id: z.string(),
        producto_id: z.string(),
        nombre_producto: z.string(),
        cantidad: z.number(),
        precio_unitario: decimal,
      }),
    )
    .default([]),
  creado_en: z.string(),
  coordinadora_numero_guia: z.string().nullish(),
  coordinadora_estado_envio: z.string().nullish(),
  wompi_estado: z.string().nullish(),
  usuario: z
    .object({ nombre_completo: z.string(), email: z.string() })
    .nullish(),
});
export function mapOrder(raw: unknown): Order {
  const o = schema.parse(raw);
  return {
    id: o.id,
    reference: o.referencia,
    status: o.estado,
    paymentMethod: o.metodo_pago,
    subtotal: o.subtotal,
    shipping: o.costo_envio,
    total: o.total,
    address: o.direccion_envio,
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.producto_id,
      name: i.nombre_producto,
      quantity: i.cantidad,
      unitPrice: i.precio_unitario,
    })),
    createdAt: o.creado_en,
    guide: o.coordinadora_numero_guia ?? null,
    shippingStatus: o.coordinadora_estado_envio ?? null,
    paymentStatus: o.wompi_estado ?? null,
    customer: o.usuario
      ? { name: o.usuario.nombre_completo, email: o.usuario.email }
      : undefined,
  };
}
export const getOrders = async () =>
  z
    .array(z.unknown())
    .parse((await api.get<unknown>("/ordenes/mis-pedidos")).data)
    .map(mapOrder);
export const getOrder = async (id: string) =>
  mapOrder((await api.get<unknown>(`/ordenes/${encodeURIComponent(id)}`)).data);
export const createOrder = async (body: NewOrder) =>
  mapOrder((await api.post<unknown>("/ordenes", body)).data);
export async function getAdminOrders(params: Record<string, string>) {
  const response = z
    .object({
      datos: z.array(z.unknown()),
      meta: z.object({
        total: z.number(),
        pagina: z.number(),
        limite: z.number(),
        totalPaginas: z.number(),
      }),
    })
    .parse((await api.get<unknown>("/ordenes/admin", { params })).data);
  return { orders: response.datos.map(mapOrder), meta: response.meta };
}
