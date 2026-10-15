import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Banknote,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";
import {
  getConversion,
  getSales,
  getStockAlerts,
  getSummary,
} from "../api/admin";
import {
  ErrorState,
  Select,
  Skeleton,
  Field,
  Input,
  EmptyState,
} from "../../../shared/ui";
import { SEO } from "../../../shared/ui/SEO";
import { date, money, number } from "../../../shared/lib/format";
export default function DashboardPage() {
  const [range, setRange] = useState("mes"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const summary = useQuery({
      queryKey: ["admin-summary"],
      queryFn: getSummary,
    }),
    alerts = useQuery({ queryKey: ["admin-stock"], queryFn: getStockAlerts }),
    conversion = useQuery({
      queryKey: ["admin-conversion"],
      queryFn: getConversion,
    });
  const valid = range !== "personalizado" || !!(from && to && from <= to);
  const params = {
    rango: range,
    ...(range === "personalizado"
      ? { desde: `${from}T00:00:00-05:00`, hasta: `${to}T23:59:59.999-05:00` }
      : {}),
  };
  const sales = useQuery({
    queryKey: ["admin-sales", params],
    queryFn: () => getSales(params),
    enabled: valid,
  });
  const series = sales.data?.serie_tiempo ?? [],
    max = Math.max(1, ...series.map((item) => item.total_ventas));
  const metrics = summary.data
    ? [
        {
          label: "Ventas acumuladas",
          value: money(summary.data.ventas_totales_cop),
          icon: Banknote,
        },
        {
          label: "Pedidos",
          value: number(summary.data.ordenes_totales),
          icon: ShoppingBag,
        },
        {
          label: "Productos activos",
          value: number(summary.data.inventario.productos_activos),
          icon: Package,
        },
        {
          label: "Clientes registrados",
          value: number(summary.data.clientes.total_registrados),
          icon: Users,
        },
      ]
    : [];
  return (
    <>
      <SEO title="Panel de administración" noIndex />
      <div className="page-heading">
        <div>
          <p className="eyebrow">TU TIENDA, EN PERSPECTIVA</p>
          <h1>Resumen general</h1>
          <p>Ventas, inventario y clientes de Mundo Clima.</p>
        </div>
      </div>
      {summary.isError ? (
        <ErrorState
          error={summary.error}
          retry={() => void summary.refetch()}
          compact
        />
      ) : (
        <div className="metric-grid">
          {summary.isPending
            ? [1, 2, 3, 4].map((i) => <Skeleton className="h-32" key={i} />)
            : metrics.map((metric) => (
                <div className="metric card" key={metric.label}>
                  <div>
                    <span>{metric.label}</span>
                    <metric.icon size={18} />
                  </div>
                  <strong>{metric.value}</strong>
                  <small>Acumulado registrado</small>
                </div>
              ))}
        </div>
      )}
      <section className="card my-6 p-5 md:p-7">
        <div className="section-title">
          <h2 className="text-lg">Ventas por período</h2>
          <Select
            className="w-auto text-xs"
            aria-label="Período de ventas"
            value={range}
            onChange={(event) => setRange(event.target.value)}
          >
            <option value="hoy">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
            <option value="ano">Este año</option>
            <option value="personalizado">Personalizado</option>
          </Select>
        </div>
        {range === "personalizado" && (
          <div className="mb-5 grid gap-3 md:grid-cols-2">
            <Field id="sales-from" label="Desde">
              <Input
                type="date"
                id="sales-from"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </Field>
            <Field id="sales-to" label="Hasta">
              <Input
                type="date"
                id="sales-to"
                value={to}
                min={from}
                onChange={(event) => setTo(event.target.value)}
              />
            </Field>
          </div>
        )}
        {!valid ? (
          <p className="text-sm text-muted">
            Selecciona un rango de fechas válido.
          </p>
        ) : sales.isError ? (
          <ErrorState
            error={sales.error}
            retry={() => void sales.refetch()}
            compact
          />
        ) : sales.isPending ? (
          <Skeleton className="h-60" />
        ) : !series.length ? (
          <EmptyState
            title="Sin ventas en este período"
            description="Aquí verás la evolución cuando existan datos."
          />
        ) : (
          <>
            <svg
              className="sales-chart"
              viewBox="0 0 720 210"
              role="img"
              aria-label="Gráfico de ventas diarias"
            >
              <line x1="0" x2="720" y1="180" y2="180" className="stroke-line" />
              {series.map((item, index) => {
                const width = 700 / series.length,
                  height = (item.total_ventas / max) * 155;
                return (
                  <g key={item.fecha}>
                    <rect
                      x={index * width + 10}
                      y={180 - height}
                      width={Math.max(2, width - 8)}
                      height={Math.max(1, height)}
                      rx="3"
                      className="fill-primary"
                    >
                      <title>
                        {item.fecha}: {money(item.total_ventas)}
                      </title>
                    </rect>
                    {index % Math.max(1, Math.ceil(series.length / 7)) ===
                      0 && (
                      <text
                        x={index * width + 10}
                        y="202"
                        className="fill-muted text-[10px]"
                      >
                        {item.fecha.slice(5)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            <details className="mt-4">
              <summary className="cursor-pointer text-xs text-primary">
                Ver datos de la gráfica
              </summary>
              <div className="data-table-wrap mt-3">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Ventas</th>
                      <th>Órdenes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {series.map((item) => (
                      <tr key={item.fecha}>
                        <td>{date(`${item.fecha}T12:00:00-05:00`)}</td>
                        <td>{money(item.total_ventas)}</td>
                        <td>{item.ordenes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="card p-5">
          <h2 className="mb-5 text-lg">Productos con stock bajo</h2>
          {alerts.isError ? (
            <ErrorState
              error={alerts.error}
              retry={() => void alerts.refetch()}
              compact
            />
          ) : alerts.isPending ? (
            <Skeleton className="h-40" />
          ) : !alerts.data.length ? (
            <p className="text-sm text-muted">No hay alertas de inventario.</p>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Stock</th>
                    <th>Mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.data.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.nombre}
                        <small className="mt-1 block text-muted">
                          {item.sku}
                        </small>
                      </td>
                      <td className="font-bold text-warning">
                        {item.inventario_stock}
                      </td>
                      <td>{item.alerta_stock_minimo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="card p-6">
          <h2 className="mb-5 flex items-center gap-2 text-lg">
            Conversión <ArrowUpRight size={19} />
          </h2>
          {conversion.isError ? (
            <ErrorState
              error={conversion.error}
              retry={() => void conversion.refetch()}
              compact
            />
          ) : conversion.isPending ? (
            <Skeleton className="h-40" />
          ) : (
            <>
              <strong className="text-4xl tabular-nums text-primary">
                {conversion.data.tasa_conversion_porcentaje}%
              </strong>
              <p className="mb-7 mt-3 text-xs text-muted">
                Conversión registrada por la tienda
              </p>
              <div className="summary-row mb-3">
                <span>Visitas</span>
                <strong>
                  {number(conversion.data.total_visitas_registradas)}
                </strong>
              </div>
              <div className="summary-row">
                <span>Órdenes completadas</span>
                <strong>{number(conversion.data.ordenes_completadas)}</strong>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
