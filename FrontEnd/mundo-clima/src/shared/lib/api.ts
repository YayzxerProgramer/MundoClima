import axios from "axios";
import { z } from "zod";
import { useSession } from "../../features/auth/hooks/session";
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});
api.interceptors.request.use((config) => {
  if (!import.meta.env.VITE_API_URL)
    throw new ApiError("Falta configurar la dirección del servicio.");
  const token = useSession.getState().token;
  if (token && !config.headers.Authorization)
    config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 0;
      if (
        status === 401 &&
        useSession.getState().token &&
        !error.config?.url?.includes("/auth/login")
      ) {
        useSession.getState().logout();
        window.dispatchEvent(new Event("session-expired"));
      }
      const body = z
        .object({
          message: z.union([z.string(), z.array(z.string())]).optional(),
        })
        .safeParse(error.response?.data);
      const detail = body.success ? body.data.message : undefined;
      const message = Array.isArray(detail) ? detail.join(". ") : detail;
      return Promise.reject(
        new ApiError(
          status === 0
            ? "No pudimos conectar con la tienda. Intenta nuevamente en un momento."
            : status >= 500
              ? "El servicio no pudo completar la solicitud. Intenta de nuevo."
              : message || "No pudimos completar la solicitud.",
          status,
        ),
      );
    }
    return Promise.reject(error);
  },
);
export const errorMessage = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : error instanceof z.ZodError
      ? "La información recibida no tiene el formato esperado."
      : "Ocurrió un error. Intenta nuevamente.";
export const decimal = z
  .union([z.number(), z.string()])
  .transform(Number)
  .pipe(z.number().finite());
export const roleSchema = z.enum([
  "ADMIN",
  "CLIENTE_FINAL",
  "TECNICO",
  "DISTRIBUIDOR",
]);
const userSchema = z.object({
  id: z.string(),
  nombre_completo: z.string(),
  email: z.string(),
  rol: roleSchema,
  telefono: z.string().nullish(),
  documento_identidad: z.string().nullish(),
  nombre_empresa: z.string().nullish(),
  esta_activo: z.boolean(),
  creado_en: z.string(),
});
export const mapUser = (raw: unknown) => {
  const u = userSchema.parse(raw);
  return {
    id: u.id,
    name: u.nombre_completo,
    email: u.email,
    role: u.rol,
    phone: u.telefono ?? null,
    document: u.documento_identidad ?? null,
    company: u.nombre_empresa ?? null,
    active: u.esta_activo,
    createdAt: u.creado_en,
  };
};
