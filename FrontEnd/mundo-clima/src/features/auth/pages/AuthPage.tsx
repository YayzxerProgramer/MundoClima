import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { authenticate } from "../api/auth";
import { SEO } from "../../../shared/ui/SEO";
import { Button, Field, Input, Select } from "../../../shared/ui";
import { errorMessage } from "../../../shared/lib/api";
import { safeReturnPath } from "../../../shared/lib/format";
const loginSchema = z.object({
  email: z.email("Escribe un correo válido"),
  password: z.string().min(6, "Usa al menos 6 caracteres"),
});
const registerSchema = loginSchema.extend({
  nombre_completo: z.string().trim().min(3, "Escribe tu nombre completo"),
  rol: z.enum(["CLIENTE_FINAL", "TECNICO", "DISTRIBUIDOR"]),
  telefono: z
    .string()
    .refine(
      (v) => !v || /^[+\d ()-]{7,20}$/.test(v),
      "Escribe un teléfono válido",
    ),
  documento_identidad: z.string(),
  nombre_empresa: z.string(),
});
type Fields = z.infer<typeof registerSchema>;
// Cuentas de la semilla del backend; solo se muestran en desarrollo.
const DEMO_ACCOUNTS = [
  ["cliente@mundoclima.com", "MundoClima2026*", "Cliente final"],
  ["tecnico@mundoclima.com", "MundoClima2026*", "Técnico"],
  ["distribuidor@mundoclima.com", "MundoClima2026*", "Distribuidor"],
  ["admin@mundoclima.com", "Admin123*", "Administrador"],
] as const;
export default function AuthPage() {
  const { pathname } = useLocation(),
    register = pathname === "/registro",
    [params] = useSearchParams(),
    navigate = useNavigate(),
    [showPassword, setShowPassword] = useState(false);
  const form = useForm<Fields>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre_completo: register ? "" : "Ingreso",
      rol: "CLIENTE_FINAL",
      telefono: "",
      documento_identidad: "",
      nombre_empresa: "",
      email: "",
      password: "",
    },
  });
  const mutation = useMutation({
    mutationFn: (values: Fields) =>
      authenticate(
        register ? "/auth/registro" : "/auth/login",
        register
          ? Object.fromEntries(
              Object.entries(values).filter(([, v]) => v !== ""),
            )
          : { email: values.email, password: values.password },
      ),
    onSuccess: () =>
      navigate(safeReturnPath(params.get("redirect")), { replace: true }),
  });
  const errors = form.formState.errors;
  const alternate = `${register ? "/login" : "/registro"}${params.get("redirect") ? `?redirect=${encodeURIComponent(params.get("redirect")!)}` : ""}`;
  return (
    <div className="container-site page-section">
      <SEO
        title={register ? "Crea tu cuenta" : "Ingresa a tu cuenta"}
        noIndex
      />
      <div className="auth-layout">
        <div className="auth-brand-panel">
          <img src="/brand/logo-white.png" alt="Mundo Clima" />
          <h2>
            Tu próximo proyecto
            <br />
            empieza aquí.
          </h2>
          <p>
            Un mundo de equipos, repuestos y soluciones, en una sola cuenta.
          </p>
          <span>
            <ShieldCheck size={19} /> Hogar · Técnicos · Distribuidores
          </span>
        </div>
        <div className="auth-form-panel">
          <p className="eyebrow">BIENVENIDO A MUNDO CLIMA</p>
          <h1>{register ? "Crezcamos juntos." : "Qué bueno verte."}</h1>
          <p className="mb-7 mt-3 text-sm text-muted">
            {register
              ? "Crea tu cuenta y encuentra la solución para cada proyecto."
              : "Ingresa para consultar tus precios y continuar tus compras."}
          </p>
          <form
            className="grid gap-5"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            noValidate
          >
            {register && (
              <Field
                label="Nombre completo"
                id="name"
                error={errors.nombre_completo?.message}
              >
                <Input
                  id="name"
                  autoComplete="name"
                  aria-invalid={!!errors.nombre_completo}
                  aria-describedby={
                    errors.nombre_completo ? "name-error" : undefined
                  }
                  {...form.register("nombre_completo")}
                />
              </Field>
            )}
            <Field
              label="Correo electrónico"
              id="email"
              error={errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...form.register("email")}
              />
            </Field>
            <Field
              label="Contraseña"
              id="password"
              error={errors.password?.message}
              hint={register ? "Mínimo 6 caracteres." : undefined}
            >
              <div className="relative">
                <Input
                  id="password"
                  className="pr-12"
                  type={showPassword ? "text" : "password"}
                  autoComplete={register ? "new-password" : "current-password"}
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  {...form.register("password")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-muted"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </Field>
            {register && (
              <>
                <Field label="¿Cómo vas a comprar?" id="role">
                  <Select id="role" {...form.register("rol")}>
                    <option value="CLIENTE_FINAL">
                      Para mi hogar o negocio
                    </option>
                    <option value="TECNICO">
                      Soy técnico de refrigeración
                    </option>
                    <option value="DISTRIBUIDOR">Soy distribuidor</option>
                  </Select>
                </Field>
                <div className="form-grid">
                  <Field
                    id="phone"
                    label="Teléfono (opcional)"
                    error={errors.telefono?.message}
                  >
                    <Input
                      id="phone"
                      autoComplete="tel"
                      type="tel"
                      {...form.register("telefono")}
                    />
                  </Field>
                  <Field id="document" label="Documento (opcional)">
                    <Input
                      id="document"
                      {...form.register("documento_identidad")}
                    />
                  </Field>
                </div>
                <Field id="company" label="Empresa (opcional)">
                  <Input
                    id="company"
                    autoComplete="organization"
                    {...form.register("nombre_empresa")}
                  />
                </Field>
              </>
            )}
            {mutation.isError && (
              <p className="form-error" role="alert">
                {errorMessage(mutation.error)}
              </p>
            )}
            <Button variant="buy" type="submit" loading={mutation.isPending}>
              {register ? "Crear mi cuenta" : "Ingresar"}
              <ArrowRight size={17} />
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">
            {register ? "¿Ya tienes una cuenta?" : "¿Aún no tienes una cuenta?"}{" "}
            <Link to={alternate} className="text-link">
              {register ? "Ingresa" : "Regístrate"}
            </Link>
          </p>
          {import.meta.env.DEV && !register && (
            <div className="mt-6 grid gap-2 rounded-control border border-dashed p-4">
              <p className="text-xs text-muted">
                Cuentas de prueba (semilla) · clic para llenar
              </p>
              {DEMO_ACCOUNTS.map(([email, password, label]) => (
                <button
                  key={email}
                  type="button"
                  className="flex items-center justify-between gap-3 rounded-control border bg-surface px-3 py-2 text-left text-sm hover:border-primary"
                  onClick={() => {
                    form.setValue("email", email, { shouldValidate: true });
                    form.setValue("password", password, {
                      shouldValidate: true,
                    });
                    mutation.reset();
                  }}
                >
                  <span className="min-w-0 truncate">{email}</span>
                  <span className="badge badge-blue whitespace-nowrap">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
