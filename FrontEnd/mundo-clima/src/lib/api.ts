import axios, { AxiosError } from 'axios'
import { useAuth } from '../store/auth'
import type { ErrorApi } from '../types/api'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const token = useAuth.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    // Token vencido o usuario desactivado: se cierra la sesión y se vuelve a precios públicos.
    const esLogin = error.config?.url?.startsWith('/auth/login')
    if (error.response?.status === 401 && !esLogin && useAuth.getState().token) {
      useAuth.getState().cerrarSesion()
    }
    return Promise.reject(error)
  },
)

/** Mensaje legible de un error de NestJS (ValidationPipe devuelve un arreglo). */
export function mensajeError(error: unknown, porDefecto = 'Ocurrió un error. Inténtalo de nuevo.'): string {
  if (axios.isAxiosError<ErrorApi>(error)) {
    if (!error.response) return 'No pudimos conectar con el servidor. Revisa tu conexión.'
    const m = error.response.data?.message
    if (Array.isArray(m)) return m[0] ?? porDefecto
    if (typeof m === 'string' && m) return m
  }
  return porDefecto
}

export const estadoHttp = (error: unknown) => (axios.isAxiosError(error) ? error.response?.status : undefined)
