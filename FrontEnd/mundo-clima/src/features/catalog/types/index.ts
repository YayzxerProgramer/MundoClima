import type { CustomerLevel, Role } from "../../auth/types";
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  children: Category[];
}
export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}
export interface TierPrice {
  id: string;
  level: Role;
  minimum: number;
  price: number;
}
export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  basePrice: number;
  price: number;
  stock: number;
  lowStock: number;
  unit: string;
  weight: number;
  active: boolean;
  featured: boolean;
  images: string[];
  btu: number | null;
  refrigerant: string | null;
  voltage: string | null;
  equipmentType: string | null;
  specifications: Record<string, string>;
  categoryId: string;
  category: Category | null;
  brandId: string;
  brand: Brand | null;
  tierPrices: TierPrice[];
  appliedLevel: Role;
  requestedLevel: Role;
  discount: boolean;
  saving: number;
  savingPercent: number;
}
export interface ProductPage {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    level: Role;
  };
}
export interface Facet {
  id: string;
  nombre: string;
  slug: string;
  conteo: number;
}
export interface CatalogFilters {
  marcas: Facet[];
  categorias: Facet[];
  opcionesBtu: number[];
  refrigerantes: string[];
  voltajes: string[];
  tiposEquipo: string[];
  rangoPrecio: { minimo: number; maximo: number };
}
export type Sort =
  | "precio_menor"
  | "precio_mayor"
  | "mas_recientes"
  | "nombre_az"
  | "destacados";
export interface ProductQuery {
  q?: string;
  categoria?: string;
  marca?: string;
  precioMinimo?: string;
  precioMaximo?: string;
  btu?: string;
  refrigerante?: string;
  voltaje?: string;
  tipoEquipo?: string;
  soloConStock?: string;
  ordenarPor?: string;
  pagina?: string;
  limite?: string;
  nivelCliente?: CustomerLevel;
}
