import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Truck } from "lucide-react";
import { quoteShipping } from "../../checkout/api/shipping";
import { Button, Field, Input, Select } from "../../../shared/ui";
import { errorMessage } from "../../../shared/lib/api";
import { money } from "../../../shared/lib/format";
import { DEPARTAMENTOS } from "../../../shared/lib/colombia";
const schema = z.object({
  departamento_destino: z.string().trim().min(2, "Selecciona el departamento"),
  ciudad_destino: z.string().trim().min(2, "Escribe la ciudad"),
});
export function ShippingEstimator({
  weight,
  value,
}: {
  weight: number;
  value: number;
}) {
  const form = useForm<z.infer<typeof schema>>({
      resolver: zodResolver(schema),
    }),
    quote = useMutation({
      mutationFn: (body: z.infer<typeof schema>) =>
        quoteShipping({
          ...body,
          peso_total_kg: weight,
          valor_declarado: value,
        }),
    });
  return (
    <div className="rounded-control border bg-canvas p-5">
      <h3 className="mb-2 flex items-center gap-2 text-sm">
        <Truck size={18} /> Calcula tu envío
      </h3>
      <p className="mb-4 text-xs leading-5 text-muted">
        Consulta el valor estimado hasta tu ciudad.
      </p>
      {weight <= 0 ? (
        <p className="text-sm text-muted">
          Este producto aún no tiene un peso registrado para cotizar el envío.
        </p>
      ) : (
        <form
          onSubmit={form.handleSubmit((body) => quote.mutate(body))}
          className="grid gap-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field
              id="quote-department"
              label="Departamento"
              error={form.formState.errors.departamento_destino?.message}
            >
              <Select
                id="quote-department"
                autoComplete="address-level1"
                {...form.register("departamento_destino")}
              >
                <option value="">Selecciona…</option>
                {DEPARTAMENTOS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </Select>
            </Field>
            <Field
              id="quote-city"
              label="Ciudad"
              error={form.formState.errors.ciudad_destino?.message}
            >
              <Input
                id="quote-city"
                autoComplete="address-level2"
                {...form.register("ciudad_destino")}
              />
            </Field>
          </div>
          <Button variant="outline" type="submit" loading={quote.isPending}>
            Cotizar envío
          </Button>
          {quote.isError && (
            <p role="alert" className="text-xs text-danger">
              {errorMessage(quote.error)}
            </p>
          )}
          {quote.data && (
            <p className="rounded-control bg-surface p-3 text-sm">
              <strong>{money(quote.data.total_flete)}</strong>
              <span className="mt-1 block text-xs text-muted">
                {quote.data.ciudad_destino} · Aproximadamente{" "}
                {quote.data.dias_entrega_estimados} días. Estimación sujeta a
                confirmación del pedido.
              </span>
            </p>
          )}
        </form>
      )}
    </div>
  );
}
