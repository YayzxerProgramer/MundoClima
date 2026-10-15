import { z } from "zod";
import { api, decimal, mapUser } from "../../../shared/lib/api";
const summarySchema = z.object({
  ventas_totales_cop: decimal,
  ordenes_totales: z.number(),
  ordenes_aprobadas_conteo: z.number(),
  ticket_promedio_cop: decimal,
  ordenes_por_estado: z.record(z.string(), z.number()),
  inventario: z.object({
    total_productos: z.number(),
    productos_activos: z.number(),
    productos_stock_bajo_conteo: z.number(),
    valor_total_inventario_cop: decimal,
  }),
  clientes: z.object({
    total_registrados: z.number(),
    clientes_finales: z.number(),
    tecnicos_profesionales: z.number(),
    distribuidores_mayoristas: z.number(),
  }),
});
export const getSummary = async () =>
  summarySchema.parse((await api.get<unknown>("/estadisticas/resumen")).data);
export const getSales = async (params: Record<string, string>) =>
  z
    .object({
      rango: z.string(),
      serie_tiempo: z.array(
        z.object({
          fecha: z.string(),
          total_ventas: decimal,
          ordenes: z.number(),
        }),
      ),
    })
    .parse(
      (await api.get<unknown>("/estadisticas/ventas-periodo", { params })).data,
    );
export const getStockAlerts = async () =>
  z
    .array(
      z.object({
        id: z.string(),
        sku: z.string(),
        nombre: z.string(),
        inventario_stock: z.number(),
        alerta_stock_minimo: z.number(),
      }),
    )
    .parse((await api.get<unknown>("/estadisticas/alertas-stock")).data);
export const getConversion = async () =>
  z
    .object({
      total_visitas_registradas: z.number(),
      ordenes_completadas: z.number(),
      tasa_conversion_porcentaje: decimal,
    })
    .parse((await api.get<unknown>("/estadisticas/conversion")).data);
export const getUsers = async () =>
  z
    .array(z.unknown())
    .parse((await api.get<unknown>("/usuarios")).data)
    .map(mapUser);
export const getUser = async (id: string) =>
  mapUser((await api.get<unknown>(`/usuarios/${id}`)).data);
export const saveUser = async (
  id: string | undefined,
  body: Record<string, string | boolean>,
) =>
  mapUser(
    (
      await (id
        ? api.patch<unknown>(`/usuarios/${id}`, body)
        : api.post<unknown>("/usuarios", body))
    ).data,
  );
export const deleteUser = async (id: string) => {
  await api.delete(`/usuarios/${id}`);
};
export interface NewProduct {
  sku: string;
  nombre: string;
  precio_base: number;
  inventario_stock: number;
  descripcion?: string;
  descripcion_corta?: string;
  alerta_stock_minimo?: number;
  unidad_medida?: string;
  esta_activo?: boolean;
  es_destacado?: boolean;
  imagenes?: string[];
  btu?: number;
  tipo_refrigerante?: string;
  voltaje?: string;
  tipo_equipo?: string;
  especificaciones?: Record<string, string>;
  categoria_id?: string;
  marca_id?: string;
  precios_nivel?: {
    nivel_cliente: "TECNICO" | "DISTRIBUIDOR";
    cantidad_minima: number;
    precio_especial: number;
  }[];
}
export const createProduct = async (body: NewProduct) => {
  await api.post<unknown>("/productos", body);
};
