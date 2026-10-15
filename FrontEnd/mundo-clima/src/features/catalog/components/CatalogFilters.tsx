import { useId } from "react";
import {
  Accordion,
  Checkbox,
  Field,
  RangeSlider,
  Select,
} from "../../../shared/ui";
import type { CatalogFilters as Filters, ProductQuery } from "../types";
export function CatalogFilters({
  filters,
  params,
  update,
}: {
  filters: Filters;
  params: ProductQuery;
  update: (values: Record<string, string>) => void;
}) {
  const uid = useId(),
    brands = params.marca?.split(",") ?? [];
  function toggleBrand(slug: string) {
    update({
      marca: (brands.includes(slug)
        ? brands.filter((v) => v !== slug)
        : [...brands, slug]
      ).join(","),
    });
  }
  const category = params.categoria ?? "",
    equipment = ["aires-acondicionados", "compresores"].includes(category),
    technical = equipment || category === "gases-refrigerantes";
  const fields = [
    {
      key: "btu",
      title: "Capacidad (BTU)",
      values: filters.opcionesBtu.map(String),
      visible: equipment,
    },
    {
      key: "tipoEquipo",
      title: "Tipo de equipo",
      values: filters.tiposEquipo,
      visible: equipment,
    },
    {
      key: "voltaje",
      title: "Voltaje",
      values: filters.voltajes,
      visible: technical,
    },
    {
      key: "refrigerante",
      title: "Refrigerante",
      values: filters.refrigerantes,
      visible: technical,
    },
  ] as const;
  const specs = fields
    .filter((field) => field.values.length && (field.visible || !category))
    .map((field) => (
      <Field key={field.key} label={field.title} id={`${uid}-${field.key}`}>
        <Select
          id={`${uid}-${field.key}`}
          value={params[field.key] ?? ""}
          onChange={(event) => update({ [field.key]: event.target.value })}
        >
          <option value="">Todos</option>
          {field.values.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </Select>
      </Field>
    ));
  return (
    <div className="catalog-filters">
      <h2 className="hidden text-base lg:block">Filtrar por</h2>
      <Accordion title="Categorías" defaultOpen>
        <div className="filter-options">
          {filters.categorias.map((item) => (
            <label key={item.id} className="checkbox-label">
              <input
                type="radio"
                name={`${uid}-category`}
                className="checkbox"
                checked={category === item.slug}
                onChange={() => update({ categoria: item.slug })}
              />
              <span className="flex w-full items-center justify-between gap-2">
                {item.nombre}
                <small className="text-muted">{item.conteo}</small>
              </span>
            </label>
          ))}
          {category && (
            <button
              className="text-link mt-2 text-xs"
              onClick={() => update({ categoria: "" })}
            >
              Todas las categorías
            </button>
          )}
        </div>
      </Accordion>
      <Accordion title="Marcas" defaultOpen>
        <div className="filter-options">
          {filters.marcas.map((item) => (
            <Checkbox
              key={item.id}
              checked={brands.includes(item.slug)}
              onChange={() => toggleBrand(item.slug)}
              label={
                <span className="flex w-full items-center justify-between gap-2">
                  {item.nombre}
                  <small className="text-muted">{item.conteo}</small>
                </span>
              }
            />
          ))}
        </div>
      </Accordion>
      <Accordion title="Precio" defaultOpen>
        <RangeSlider
          key={`${params.precioMinimo}-${params.precioMaximo}-${filters.rangoPrecio.minimo}`}
          min={filters.rangoPrecio.minimo}
          max={filters.rangoPrecio.maximo}
          from={Number(params.precioMinimo ?? filters.rangoPrecio.minimo)}
          to={Number(params.precioMaximo ?? filters.rangoPrecio.maximo)}
          onApply={(from, to) =>
            update({ precioMinimo: String(from), precioMaximo: String(to) })
          }
        />
      </Accordion>
      <div className="border-b py-3">
        <Checkbox
          checked={params.soloConStock === "true"}
          onChange={(event) =>
            update({ soloConStock: event.target.checked ? "true" : "" })
          }
          label="Solo productos con stock"
        />
      </div>
      {specs.length > 0 && (
        <Accordion title="Especificaciones técnicas" defaultOpen={!!category}>
          <div className="grid gap-4">{specs}</div>
        </Accordion>
      )}
      <p className="mt-5 text-[11px] leading-5 text-muted">
        Las cantidades corresponden al catálogo completo.
      </p>
    </div>
  );
}
