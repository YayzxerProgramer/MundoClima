import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Truck } from "lucide-react";
import { trackShipment } from "../../checkout/api/shipping";
import {
  Breadcrumbs,
  Button,
  ErrorState,
  Field,
  Input,
  Skeleton,
} from "../../../shared/ui";
import { SEO } from "../../../shared/ui/SEO";
import { date } from "../../../shared/lib/format";
const schema = z.object({
  guide: z
    .string()
    .trim()
    .min(5, "Escribe al menos 5 caracteres")
    .max(100, "Revisa el número de guía"),
});
export default function TrackingPage() {
  const [params, setParams] = useSearchParams(),
    guide = params.get("guia") ?? "";
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { guide },
  });
  const query = useQuery({
    queryKey: ["tracking", guide],
    queryFn: () => trackShipment(guide),
    enabled: guide.length >= 5,
  });
  return (
    <div className="container-site pb-10">
      <SEO title="Rastrea tu envío" noIndex />
      <Breadcrumbs items={[{ label: "Rastrea tu envío" }]} />
      <div className="mx-auto max-w-2xl">
        <div className="page-heading">
          <div>
            <p className="eyebrow">YA FALTA MENOS</p>
            <h1>¿Dónde va tu pedido?</h1>
            <p>
              Escribe el número de guía que aparece en el detalle de tu compra.
            </p>
          </div>
        </div>
        <form
          className="card mb-6 grid gap-4 p-6"
          onSubmit={form.handleSubmit((values) =>
            setParams({ guia: values.guide }),
          )}
        >
          <Field
            id="guide"
            label="Número de guía"
            error={form.formState.errors.guide?.message}
          >
            <Input
              id="guide"
              placeholder="Ej. 7700123456789"
              {...form.register("guide")}
            />
          </Field>
          <Button type="submit" loading={query.isFetching}>
            <Truck size={18} /> Rastrear envío
          </Button>
        </form>
        {guide.length >= 5 &&
          (query.isError ? (
            <ErrorState
              error={query.error}
              retry={() => void query.refetch()}
            />
          ) : query.isPending ? (
            <Skeleton className="h-64" />
          ) : (
            <div className="card p-6">
              <p className="mb-4 rounded-control bg-warning/10 p-3 text-xs leading-5 text-warning">
                Seguimiento de pruebas: la información actual es simulada y no
                confirma la ubicación real del transportador.
              </p>
              <p className="eyebrow">{query.data.transportadora}</p>
              <h2 className="text-xl">
                {query.data.estado_actual.replaceAll("_", " ")}
              </h2>
              <p className="my-4 flex items-center gap-2 text-sm text-muted">
                <MapPin size={16} />
                {query.data.ubicacion_actual}
              </p>
              <ol className="tracking-timeline">
                {query.data.historial.map((event, index) => (
                  <li key={`${event.fecha}-${index}`}>
                    <span />
                    <div>
                      <strong>{event.evento}</strong>
                      <p>{date(event.fecha)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
      </div>
    </div>
  );
}
