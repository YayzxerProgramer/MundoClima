import { z } from "zod";
import { api, decimal, roleSchema, ApiError } from "../../../shared/lib/api";
import type {
  Category,
  Brand,
  Product,
  ProductPage,
  ProductQuery,
  CatalogFilters,
} from "../types";
import type { CustomerLevel } from "../../auth/types";
const rawCategory: z.ZodType<Category> = z.lazy(() =>
  z
    .object({
      id: z.string(),
      nombre: z.string(),
      slug: z.string(),
      descripcion: z.string().nullish(),
      imagen_url: z.string().nullish(),
      hijos: z.array(rawCategory).optional(),
    })
    .transform((c) => ({
      id: c.id,
      name: c.nombre,
      slug: c.slug,
      description: c.descripcion ?? null,
      image: c.imagen_url ?? null,
      children: c.hijos ?? [],
    })),
);
const rawBrand = z
  .object({
    id: z.string(),
    nombre: z.string(),
    slug: z.string(),
    logo_url: z.string().nullish(),
  })
  .transform((b) => ({
    id: b.id,
    name: b.nombre,
    slug: b.slug,
    logo: b.logo_url ?? null,
  }));
const tier = z
  .object({
    id: z.string(),
    nivel_cliente: roleSchema,
    cantidad_minima: z.number(),
    precio_especial: decimal,
  })
  .transform((p) => ({
    id: p.id,
    level: p.nivel_cliente,
    minimum: p.cantidad_minima,
    price: p.precio_especial,
  }));
const rawProduct = z.object({
  id: z.string(),
  sku: z.string(),
  nombre: z.string(),
  slug: z.string(),
  descripcion: z.string().nullish(),
  descripcion_corta: z.string().nullish(),
  precio_base: decimal,
  precio_aplicado: decimal,
  inventario_stock: z.number(),
  alerta_stock_minimo: z.number(),
  unidad_medida: z.string(),
  peso_kg: decimal.default(0),
  esta_activo: z.boolean(),
  es_destacado: z.boolean(),
  imagenes: z.array(z.string()).nullish(),
  btu: z.number().nullish(),
  tipo_refrigerante: z.string().nullish(),
  voltaje: z.string().nullish(),
  tipo_equipo: z.string().nullish(),
  especificaciones: z
    .record(z.string(), z.union([z.string(), z.number()]))
    .nullish(),
  categoria_id: z.string().nullish(),
  categoria: rawCategory.nullish(),
  marca_id: z.string().nullish(),
  marca: rawBrand.nullish(),
  precios_nivel: z.array(tier).optional(),
  nivel_coincidido: roleSchema,
  nivel_solicitado: roleSchema,
  tiene_descuento_b2b: z.boolean(),
  monto_ahorro: decimal,
  porcentaje_ahorro: decimal,
});
export function mapProduct(raw: unknown): Product {
  const p = rawProduct.parse(raw);
  return {
    id: p.id,
    sku: p.sku,
    name: p.nombre,
    slug: p.slug,
    description: p.descripcion ?? null,
    shortDescription: p.descripcion_corta ?? null,
    basePrice: p.precio_base,
    price: p.precio_aplicado,
    stock: p.inventario_stock,
    lowStock: p.alerta_stock_minimo,
    unit: p.unidad_medida,
    weight: p.peso_kg,
    active: p.esta_activo,
    featured: p.es_destacado,
    images: p.imagenes ?? [],
    btu: p.btu ?? null,
    refrigerant: p.tipo_refrigerante ?? null,
    voltage: p.voltaje ?? null,
    equipmentType: p.tipo_equipo ?? null,
    specifications: Object.fromEntries(
      Object.entries(p.especificaciones ?? {}).map(([key, value]) => [
        key,
        String(value),
      ]),
    ),
    categoryId: p.categoria_id ?? "",
    category: p.categoria ?? null,
    brandId: p.marca_id ?? "",
    brand: p.marca ?? null,
    tierPrices: p.precios_nivel ?? [],
    appliedLevel: p.nivel_coincidido,
    requestedLevel: p.nivel_solicitado,
    discount: p.tiene_descuento_b2b,
    saving: p.monto_ahorro,
    savingPercent: p.porcentaje_ahorro,
  };
}
export const getCategories = async (): Promise<Category[]> =>
  z.array(rawCategory).parse((await api.get<unknown>("/categorias")).data);
export const getBrands = async (): Promise<Brand[]> =>
  z.array(rawBrand).parse((await api.get<unknown>("/marcas")).data);
export const flattenCategories = (items: Category[]): Category[] =>
  items.flatMap((item) => [item, ...flattenCategories(item.children)]);
// La URL usa slugs; PostgreSQL necesita UUID en el OR actual del backend.
export const catalogIdentifier = (
  slug: string,
  values: { id: string; slug: string }[],
) => {
  const match = values.find((item) => item.slug === slug || item.id === slug);
  if (!match)
    throw new ApiError("Esta categoría o marca no está disponible.", 404);
  return match.id;
};
export function buildProductQuery(
  query: ProductQuery,
  categories: Category[],
  brands: Brand[],
  level: CustomerLevel,
) {
  const params: ProductQuery = Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== "" && value !== undefined,
    ),
  );
  // GET /productos responde 500 con `categoria` (slug o id: compara el mismo
  // parámetro contra texto y uuid). La categoría y sus subcategorías se filtran
  // en el cliente; quitar cuando el backend compare categoria.id::text.
  let categoryIds: string[] | null = null;
  if (query.categoria) {
    const flat = flattenCategories(categories);
    const id = catalogIdentifier(query.categoria, flat);
    categoryIds = flattenCategories(flat.filter((c) => c.id === id)).map(
      (c) => c.id,
    );
    delete params.categoria;
  }
  if (query.marca)
    params.marca = query.marca
      .split(",")
      .map((slug) => catalogIdentifier(slug, brands))
      .join(",");
  return { params: { ...params, nivelCliente: level }, categoryIds };
}
const productPage = z.object({
  datos: z.array(z.unknown()),
  meta: z.object({
    total: z.number(),
    pagina: z.number(),
    limite: z.number(),
    totalPaginas: z.number(),
    nivelCliente: roleSchema,
  }),
});
// Tope del DTO de GET /productos (@Max(100)).
const MAX_LIMIT = 100;
export async function getProducts(
  { params, categoryIds }: ReturnType<typeof buildProductQuery>,
  signal?: AbortSignal,
): Promise<ProductPage> {
  if (categoryIds) return getProductsInCategory(params, categoryIds, signal);
  const raw = productPage.parse(
    (await api.get<unknown>("/productos", { params, signal })).data,
  );
  return {
    data: raw.datos.map(mapProduct),
    meta: {
      total: raw.meta.total,
      page: raw.meta.pagina,
      limit: raw.meta.limite,
      pages: raw.meta.totalPaginas,
      level: raw.meta.nivelCliente,
    },
  };
}
async function getProductsInCategory(
  params: ReturnType<typeof buildProductQuery>["params"],
  categoryIds: string[],
  signal?: AbortSignal,
): Promise<ProductPage> {
  const all: Product[] = [];
  let level: ProductPage["meta"]["level"] = params.nivelCliente;
  for (let page = 1, pages = 1; page <= pages; page++) {
    const raw = productPage.parse(
      (
        await api.get<unknown>("/productos", {
          params: { ...params, pagina: page, limite: MAX_LIMIT },
          signal,
        })
      ).data,
    );
    all.push(...raw.datos.map(mapProduct));
    pages = raw.meta.totalPaginas;
    level = raw.meta.nivelCliente;
  }
  const data = all.filter((p) => categoryIds.includes(p.categoryId));
  const limit = Number(params.limite) || 12;
  const page = Number(params.pagina) || 1;
  return {
    data: data.slice((page - 1) * limit, page * limit),
    meta: {
      total: data.length,
      page,
      limit,
      pages: Math.max(1, Math.ceil(data.length / limit)),
      level,
    },
  };
}
export const getProduct = async (
  id: string,
  level: CustomerLevel,
  signal?: AbortSignal,
) =>
  mapProduct(
    (
      await api.get<unknown>(`/productos/${encodeURIComponent(id)}`, {
        params: { nivel: level },
        signal,
      })
    ).data,
  );
const facet = z.object({
  id: z.string(),
  nombre: z.string(),
  slug: z.string(),
  conteo: z.number(),
});
export const getFilters = async (): Promise<CatalogFilters> =>
  z
    .object({
      marcas: z.array(facet),
      categorias: z.array(facet),
      opcionesBtu: z.array(z.number()),
      refrigerantes: z.array(z.string()),
      voltajes: z.array(z.string()),
      tiposEquipo: z.array(z.string()),
      rangoPrecio: z.object({ minimo: decimal, maximo: decimal }),
    })
    .parse((await api.get<unknown>("/productos/filtros")).data);
