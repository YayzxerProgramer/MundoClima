export type OrderStatus =
  | "PENDIENTE_PAGO"
  | "PAGADO"
  | "CONFIRMADO_CONTRAENTREGA"
  | "EN_CAMINO"
  | "ENTREGADO"
  | "CANCELADO";
export type PaymentMethod = "WOMPI" | "CONTRAENTREGA";
export interface Address {
  calle: string;
  ciudad: string;
  departamento: string;
  telefono_contacto: string;
}
export interface Order {
  id: string;
  reference: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shipping: number;
  total: number;
  address: Address;
  items: {
    id: string;
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }[];
  createdAt: string;
  guide: string | null;
  shippingStatus: string | null;
  paymentStatus: string | null;
  customer?: { name: string; email: string };
}
export interface NewOrder {
  items: { producto_id: string; cantidad: number }[];
  metodo_pago: PaymentMethod;
  direccion_envio: Address;
}
export const orderLabels: Record<OrderStatus, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  PAGADO: "Pago confirmado",
  CONFIRMADO_CONTRAENTREGA: "Contraentrega confirmada",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};
export const confirmedPayment = (status: OrderStatus) =>
  ["PAGADO", "EN_CAMINO", "ENTREGADO"].includes(status);
