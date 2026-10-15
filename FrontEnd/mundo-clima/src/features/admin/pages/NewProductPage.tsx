import { useNavigate } from "react-router-dom";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { createProduct } from "../api/admin";
import { useBrands, useCategories } from "../../catalog/hooks/queries";
import { flattenCategories } from "../../catalog/api/catalog";
import { Button, Checkbox, Field, Input, Select } from "../../../shared/ui";
import { SEO } from "../../../shared/ui/SEO";
import { errorMessage } from "../../../shared/lib/api";
import { queryClient } from "../../../shared/lib/query";
import { useUI } from "../../../shared/hooks/ui-store";
const schema = z.object({
  sku: z.string().trim().min(1, "La referencia es obligatoria"),
  nombre: z.string().trim().min(3, "Escribe el nombre del producto"),
  precio_base: z
    .number("Escribe un precio")
    .nonnegative("El precio no puede ser negativo"),
  inventario_stock: z.number("Escribe el stock").int().nonnegative(),
  alerta_stock_minimo: z.number().int().nonnegative(),
  descripcion: z.string(),
  descripcion_corta: z.string(),
  unidad_medida: z.string().min(1),
  esta_activo: z.boolean(),
  es_destacado: z.boolean(),
  categoria_id: z.string(),
  marca_id: z.string(),
  imagenes: z.string().refine(
    (value) =>
      value
        .split("\n")
        .filter(Boolean)
        .every((url) => /^https?:\/\/\S+$/.test(url.trim())),
    "Usa una URL https:// por línea",
  ),
  btu: z
    .string()
    .refine((value) => !value || /^\d+$/.test(value), "Usa un número entero"),
  tipo_refrigerante: z.string(),
  voltaje: z.string(),
  tipo_equipo: z.string(),
  especificaciones: z.array(
    z.object({
      key: z.string().trim().min(1, "Escribe el atributo"),
      value: z.string().trim().min(1, "Escribe el valor"),
    }),
  ),
  precios_nivel: z.array(
    z.object({
      nivel_cliente: z.enum(["TECNICO", "DISTRIBUIDOR"]),
      cantidad_minima: z.number().int().min(1),
      precio_especial: z.number().nonnegative(),
    }),
  ),
});
type Values = z.infer<typeof schema>;
export default function NewProductPage() {
  const navigate = useNavigate(),
    categories = useCategories(),
    brands = useBrands();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      sku: "",
      nombre: "",
      precio_base: 0,
      inventario_stock: 0,
      alerta_stock_minimo: 5,
      descripcion: "",
      descripcion_corta: "",
      unidad_medida: "unidad",
      esta_activo: true,
      es_destacado: false,
      categoria_id: "",
      marca_id: "",
      imagenes: "",
      btu: "",
      tipo_refrigerante: "",
      voltaje: "",
      tipo_equipo: "",
      especificaciones: [],
      precios_nivel: [],
    },
  });
  const specs = useFieldArray({
      control: form.control,
      name: "especificaciones",
    }),
    tiers = useFieldArray({ control: form.control, name: "precios_nivel" });
  const mutation = useMutation({
    mutationFn: (values: Values) =>
      createProduct({
        sku: values.sku,
        nombre: values.nombre,
        precio_base: values.precio_base,
        inventario_stock: values.inventario_stock,
        alerta_stock_minimo: values.alerta_stock_minimo,
        descripcion: values.descripcion,
        descripcion_corta: values.descripcion_corta,
        unidad_medida: values.unidad_medida,
        esta_activo: values.esta_activo,
        es_destacado: values.es_destacado,
        ...(values.categoria_id ? { categoria_id: values.categoria_id } : {}),
        ...(values.marca_id ? { marca_id: values.marca_id } : {}),
        imagenes: values.imagenes
          .split("\n")
          .map((url) => url.trim())
          .filter(Boolean),
        ...(values.btu ? { btu: Number(values.btu) } : {}),
        ...(values.tipo_refrigerante
          ? { tipo_refrigerante: values.tipo_refrigerante }
          : {}),
        ...(values.voltaje ? { voltaje: values.voltaje } : {}),
        ...(values.tipo_equipo ? { tipo_equipo: values.tipo_equipo } : {}),
        especificaciones: Object.fromEntries(
          values.especificaciones.map((pair) => [pair.key, pair.value]),
        ),
        precios_nivel: values.precios_nivel,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["filters"] });
      useUI.getState().toast("Producto creado");
      navigate("/admin/productos");
    },
  });
  const e = form.formState.errors;
  return (
    <>
      <SEO title="Nuevo producto" noIndex />
      <div className="page-heading">
        <div>
          <p className="eyebrow">AMPLÍA TU CATÁLOGO</p>
          <h1>Nuevo producto</h1>
        </div>
      </div>
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        noValidate
        className="grid gap-6"
      >
        <section className="card p-5 md:p-7">
          <h2 className="mb-5 text-lg">Información principal</h2>
          <div className="form-grid">
            <Field
              id="product-name"
              label="Nombre del producto"
              error={e.nombre?.message}
            >
              <Input
                id="product-name"
                {...form.register("nombre")}
                aria-invalid={!!e.nombre}
              />
            </Field>
            <Field id="sku" label="SKU / referencia" error={e.sku?.message}>
              <Input
                id="sku"
                {...form.register("sku")}
                aria-invalid={!!e.sku}
              />
            </Field>
            <Field
              id="base-price"
              label="Precio base (COP)"
              error={e.precio_base?.message}
            >
              <Input
                id="base-price"
                type="number"
                min="0"
                step="1"
                {...form.register("precio_base", { valueAsNumber: true })}
              />
            </Field>
            <Field
              id="stock"
              label="Inventario disponible"
              error={e.inventario_stock?.message}
            >
              <Input
                id="stock"
                type="number"
                min="0"
                step="1"
                {...form.register("inventario_stock", { valueAsNumber: true })}
              />
            </Field>
            <Field
              id="low-stock"
              label="Alerta de stock mínimo"
              error={e.alerta_stock_minimo?.message}
            >
              <Input
                id="low-stock"
                type="number"
                min="0"
                {...form.register("alerta_stock_minimo", {
                  valueAsNumber: true,
                })}
              />
            </Field>
            <Field
              id="unit"
              label="Unidad de medida"
              error={e.unidad_medida?.message}
            >
              <Input id="unit" {...form.register("unidad_medida")} />
            </Field>
            <Field id="product-category" label="Categoría">
              <Select id="product-category" {...form.register("categoria_id")}>
                <option value="">Selecciona una categoría</option>
                {flattenCategories(categories.data ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="product-brand" label="Marca">
              <Select id="product-brand" {...form.register("marca_id")}>
                <option value="">Selecciona una marca</option>
                {brands.data?.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="mt-5 grid gap-5">
            <Field id="short-description" label="Descripción corta">
              <Input
                id="short-description"
                {...form.register("descripcion_corta")}
              />
            </Field>
            <Field id="description" label="Descripción">
              <textarea
                id="description"
                rows={5}
                className="input"
                {...form.register("descripcion")}
              />
            </Field>
            <Field
              id="images"
              label="Imágenes (una URL por línea)"
              error={e.imagenes?.message}
            >
              <textarea
                id="images"
                rows={3}
                className="input"
                placeholder="https://…"
                {...form.register("imagenes")}
              />
            </Field>
            <div className="flex flex-wrap gap-6">
              <Checkbox
                label="Producto activo"
                {...form.register("esta_activo")}
              />
              <Checkbox
                label="Producto destacado"
                {...form.register("es_destacado")}
              />
            </div>
          </div>
        </section>
        <section className="card p-5 md:p-7">
          <h2 className="mb-5 text-lg">Especificaciones técnicas</h2>
          <div className="form-grid">
            <Field
              id="btu"
              label="Capacidad en BTU (opcional)"
              error={e.btu?.message}
            >
              <Input id="btu" inputMode="numeric" {...form.register("btu")} />
            </Field>
            <Field id="voltage" label="Voltaje (opcional)">
              <Input
                id="voltage"
                placeholder="220V 1Ph"
                {...form.register("voltaje")}
              />
            </Field>
            <Field id="refrigerant" label="Refrigerante (opcional)">
              <Input
                id="refrigerant"
                placeholder="R-32"
                {...form.register("tipo_refrigerante")}
              />
            </Field>
            <Field id="equipment" label="Tipo de equipo (opcional)">
              <Input
                id="equipment"
                placeholder="Mini Split"
                {...form.register("tipo_equipo")}
              />
            </Field>
          </div>
          <div className="mt-6 grid gap-3">
            {specs.fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  aria-label={`Atributo ${index + 1}`}
                  placeholder="Atributo"
                  {...form.register(`especificaciones.${index}.key`)}
                />
                <Input
                  aria-label={`Valor ${index + 1}`}
                  placeholder="Valor"
                  {...form.register(`especificaciones.${index}.value`)}
                />
                <Button
                  variant="ghost"
                  className="icon-btn"
                  aria-label={`Quitar especificación ${index + 1}`}
                  onClick={() => specs.remove(index)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            {e.especificaciones && (
              <p role="alert" className="text-sm text-danger">
                Completa el nombre y el valor de cada especificación.
              </p>
            )}
            <Button
              variant="outline"
              onClick={() => specs.append({ key: "", value: "" })}
            >
              <Plus size={16} /> Agregar especificación
            </Button>
          </div>
        </section>
        <section className="card p-5 md:p-7">
          <h2 className="mb-5 text-lg">Precios profesionales y por volumen</h2>
          <div className="grid gap-3">
            {tiers.fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-control border p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
              >
                <Field id={`tier-level-${index}`} label="Nivel">
                  <Select
                    id={`tier-level-${index}`}
                    {...form.register(`precios_nivel.${index}.nivel_cliente`)}
                  >
                    <option value="TECNICO">Técnico</option>
                    <option value="DISTRIBUIDOR">Distribuidor</option>
                  </Select>
                </Field>
                <Field id={`tier-min-${index}`} label="Desde cantidad">
                  <Input
                    id={`tier-min-${index}`}
                    type="number"
                    min="1"
                    {...form.register(
                      `precios_nivel.${index}.cantidad_minima`,
                      { valueAsNumber: true },
                    )}
                  />
                </Field>
                <Field id={`tier-price-${index}`} label="Precio (COP)">
                  <Input
                    id={`tier-price-${index}`}
                    type="number"
                    min="0"
                    {...form.register(
                      `precios_nivel.${index}.precio_especial`,
                      { valueAsNumber: true },
                    )}
                  />
                </Field>
                <Button
                  variant="ghost"
                  className="icon-btn self-end"
                  aria-label={`Quitar precio ${index + 1}`}
                  onClick={() => tiers.remove(index)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            {e.precios_nivel && (
              <p role="alert" className="text-sm text-danger">
                Revisa las cantidades y precios de cada nivel.
              </p>
            )}
            <Button
              variant="outline"
              onClick={() =>
                tiers.append({
                  nivel_cliente: "TECNICO",
                  cantidad_minima: 1,
                  precio_especial: 0,
                })
              }
            >
              <Plus size={16} /> Agregar precio por nivel
            </Button>
          </div>
        </section>
        {mutation.isError && (
          <p className="form-error" role="alert">
            {errorMessage(mutation.error)}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/productos")}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Crear producto
          </Button>
        </div>
      </form>
    </>
  );
}
