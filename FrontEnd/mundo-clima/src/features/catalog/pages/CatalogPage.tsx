import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Grid2X2, List, SlidersHorizontal, X } from "lucide-react";
import { SEO } from "../../../shared/ui/SEO";
import {
  Breadcrumbs,
  Button,
  Drawer,
  EmptyState,
  ErrorState,
  Pagination,
  ProductSkeletons,
  Select,
  Skeleton,
} from "../../../shared/ui";
import { CatalogFilters } from "../components/CatalogFilters";
import { ProductCard } from "../components/ProductCard";
import { useCategories, useFilters, useProducts } from "../hooks/queries";
import { flattenCategories } from "../api/catalog";
import type { ProductQuery } from "../types";
import { money } from "../../../shared/lib/format";
const keys = [
  "q",
  "categoria",
  "marca",
  "precioMinimo",
  "precioMaximo",
  "btu",
  "refrigerante",
  "voltaje",
  "tipoEquipo",
  "soloConStock",
  "ordenarPor",
] as const;
export default function CatalogPage() {
  const { slug } = useParams(),
    [search, setSearch] = useSearchParams(),
    navigate = useNavigate(),
    [drawer, setDrawer] = useState(false);
  const params: ProductQuery = {
    ...Object.fromEntries(
      keys.map((key) => [key, search.get(key) ?? undefined]),
    ),
    categoria: slug || search.get("categoria") || undefined,
    pagina: String(Math.max(1, parseInt(search.get("pagina") ?? "1") || 1)),
    limite: "12",
  };
  const products = useProducts(params),
    filters = useFilters(),
    categories = useCategories();
  const category = flattenCategories(categories.data ?? []).find(
    (item) => item.slug === params.categoria,
  );
  const title =
    category?.name ??
    (params.q ? `Resultados para “${params.q}”` : "Todos los productos");
  const list = search.get("vista") === "lista";
  function update(values: Record<string, string>) {
    const next = new URLSearchParams(search);
    next.delete("pagina");
    Object.entries(values).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if ("categoria" in values && slug) {
      next.delete("categoria");
      navigate(
        `${values.categoria ? `/categoria/${values.categoria}` : "/productos"}${next.size ? `?${next}` : ""}`,
      );
    } else setSearch(next);
  }
  const labels: Record<string, string> = {
    q: "Búsqueda",
    categoria: "Categoría",
    marca: "Marca",
    precioMinimo: "Desde",
    precioMaximo: "Hasta",
    btu: "BTU",
    refrigerante: "Refrigerante",
    voltaje: "Voltaje",
    tipoEquipo: "Equipo",
    soloConStock: "Con stock",
  };
  const chips = keys
    .filter((key) => params[key] && key !== "ordenarPor")
    .flatMap<{ key: string; value: string; label: string }>((key) =>
      key === "marca"
        ? (params.marca?.split(",") ?? []).map((value) => ({
            key,
            value,
            label:
              filters.data?.marcas.find((b) => b.slug === value)?.nombre ??
              value,
          }))
        : [
            {
              key,
              value: params[key]!,
              label:
                key === "categoria"
                  ? (category?.name ?? params[key]!)
                  : key === "soloConStock"
                    ? "Con stock"
                    : key.startsWith("precio")
                      ? money(Number(params[key]))
                      : params[key]!,
            },
          ],
    );
  const filterContent = filters.isError ? (
    <ErrorState
      compact
      error={filters.error}
      retry={() => void filters.refetch()}
    />
  ) : filters.isPending ? (
    <div className="grid gap-5">
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
    </div>
  ) : (
    <CatalogFilters filters={filters.data} params={params} update={update} />
  );
  return (
    <div className="container-site pb-10">
      <SEO title={title} />
      <Breadcrumbs
        items={[
          {
            label: "Catálogo",
            to: params.categoria ? "/productos" : undefined,
          },
          ...(params.categoria ? [{ label: title }] : []),
        ]}
      />
      <div className="page-heading">
        <div>
          <p className="eyebrow">ENCUENTRA TU SOLUCIÓN</p>
          <h1>{title}</h1>
          <p>
            {category?.description ??
              "Equipos, repuestos y herramientas para que cada proyecto tenga el mejor clima."}
          </p>
        </div>
      </div>
      <div className="catalog-layout">
        <aside className="hidden lg:block">{filterContent}</aside>
        <div className="catalog-products">
          <div className="catalog-toolbar">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="btn-sm lg:hidden"
                onClick={() => setDrawer(true)}
              >
                <SlidersHorizontal size={16} /> Filtros
              </Button>
              <p className="text-xs text-muted" aria-live="polite">
                {products.data
                  ? `${products.data.meta.total} productos`
                  : "Catálogo"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="sort-products"
                className="hidden text-xs text-muted md:inline"
              >
                Ordenar por
              </label>
              <Select
                id="sort-products"
                className="min-h-10 w-auto max-w-44 py-2 text-xs"
                value={params.ordenarPor ?? "destacados"}
                onChange={(event) => update({ ordenarPor: event.target.value })}
              >
                <option value="destacados">Destacados</option>
                <option value="precio_menor">Menor precio</option>
                <option value="precio_mayor">Mayor precio</option>
                <option value="mas_recientes">Más recientes</option>
                <option value="nombre_az">Nombre A–Z</option>
              </Select>
              <div className="hidden items-center md:flex">
                <Button
                  className="icon-btn"
                  variant={!list ? "outline" : "ghost"}
                  aria-label="Vista en grilla"
                  aria-pressed={!list}
                  onClick={() => update({ vista: "" })}
                >
                  <Grid2X2 size={18} />
                </Button>
                <Button
                  className="icon-btn"
                  variant={list ? "outline" : "ghost"}
                  aria-label="Vista en lista"
                  aria-pressed={list}
                  onClick={() => update({ vista: "lista" })}
                >
                  <List size={18} />
                </Button>
              </div>
            </div>
          </div>
          {chips.length > 0 && (
            <div className="filter-chips">
              {chips.map((chip) => (
                <button
                  key={`${chip.key}-${chip.value}`}
                  onClick={() =>
                    update({
                      [chip.key]:
                        chip.key === "marca"
                          ? params
                              .marca!.split(",")
                              .filter((value) => value !== chip.value)
                              .join(",")
                          : "",
                    })
                  }
                  aria-label={`Quitar ${labels[chip.key]}: ${chip.label}`}
                >
                  {chip.label}
                  <X size={13} />
                </button>
              ))}
              <Link className="text-link text-xs" to="/productos">
                Limpiar todo
              </Link>
            </div>
          )}
          {products.isError ? (
            <ErrorState
              error={products.error}
              retry={() => void products.refetch()}
            />
          ) : products.isPending ? (
            <ProductSkeletons count={6} />
          ) : products.data?.data.length ? (
            <div className={list ? "product-list" : "product-grid"}>
              {products.data.data.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No encontramos productos con estos filtros"
              description="Prueba otra palabra o quita algún filtro. También puedes explorar nuestras categorías."
            >
              <div className="flex flex-wrap justify-center gap-3">
                {categories.data?.slice(0, 3).map((item) => (
                  <Link
                    className="text-link"
                    key={item.id}
                    to={`/categoria/${item.slug}`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <Link to="/productos" className="btn btn-outline">
                Limpiar filtros
              </Link>
            </EmptyState>
          )}
          {products.data && (
            <Pagination
              page={products.data.meta.page}
              pages={products.data.meta.pages}
              onChange={(page) => {
                const next = new URLSearchParams(search);
                next.set("pagina", String(page));
                setSearch(next);
                window.scrollTo({ top: 0, behavior: "instant" });
              }}
            />
          )}
        </div>
      </div>
      <Drawer
        title="Filtra tu búsqueda"
        open={drawer}
        onClose={() => setDrawer(false)}
      >
        {filterContent}
        <Button className="mt-5 w-full" onClick={() => setDrawer(false)}>
          Ver resultados
        </Button>
      </Drawer>
    </div>
  );
}
