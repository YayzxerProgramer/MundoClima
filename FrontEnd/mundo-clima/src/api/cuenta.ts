import { useMutation, useQuery, useQueryClient, type Query } from '@tanstack/react-query'
import { api } from '../lib/api'
import { primerNombre } from '../lib/formato'
import { useAuth } from '../store/auth'
import { useUI } from '../store/ui'
import type {
  CotizacionEnvio,
  CrearOrdenBody,
  FirmaWompi,
  Orden,
  Rastreo,
  RespuestaLogin,
  RespuestaRegistro,
  Rol,
  Usuario,
} from '../types/api'

/** POST /auth/login → access_token → GET /auth/perfil (el login no devuelve el usuario). */
export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { email: string; password: string }) => {
      const { access_token } = (await api.post<RespuestaLogin>('/auth/login', body)).data
      const usuario = (
        await api.get<Usuario>('/auth/perfil', { headers: { Authorization: `Bearer ${access_token}` } })
      ).data
      return { token: access_token, usuario }
    },
    onSuccess: ({ token, usuario }) => {
      useAuth.getState().iniciarSesion(token, usuario)
      qc.removeQueries({ queryKey: ['mis-pedidos'] })
      useUI.getState().avisar(`Hola, ${primerNombre(usuario.nombre_completo)} · precios actualizados`)
    },
  })
}

export interface RegistroBody {
  nombre_completo: string
  email: string
  password: string
  rol: Exclude<Rol, 'ADMIN'>
  telefono?: string
  documento_identidad?: string
  nombre_empresa?: string
}

/** POST /auth/registro ya devuelve token y usuario. */
export function useRegistro() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: RegistroBody) => (await api.post<RespuestaRegistro>('/auth/registro', body)).data,
    onSuccess: ({ access_token, usuario }) => {
      useAuth.getState().iniciarSesion(access_token, usuario)
      qc.removeQueries({ queryKey: ['mis-pedidos'] })
      useUI.getState().avisar('Cuenta creada. ¡Bienvenido a Mundo Clima!')
    },
  })
}

/** Perfil completo (incluye creado_en). */
export function usePerfil() {
  const token = useAuth((s) => s.token)
  return useQuery({
    queryKey: ['perfil', token],
    queryFn: async () => {
      const u = (await api.get<Usuario>('/auth/perfil')).data
      useAuth.getState().actualizarUsuario(u)
      return u
    },
    enabled: !!token,
  })
}

export function useMisPedidos() {
  const token = useAuth((s) => s.token)
  return useQuery({
    queryKey: ['mis-pedidos', token],
    queryFn: async () => (await api.get<Orden[]>('/ordenes/mis-pedidos')).data,
    enabled: !!token,
  })
}

/** `refetchInterval` permite consultar el estado mientras llega el webhook de Wompi. */
export function useOrden(id: string | undefined, refetchInterval?: number | false | ((q: Query<Orden>) => number | false)) {
  return useQuery({
    queryKey: ['orden', id],
    queryFn: async () => (await api.get<Orden>(`/ordenes/${id}`)).data,
    enabled: !!id,
    refetchInterval,
  })
}

export function useCrearOrden() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CrearOrdenBody) => (await api.post<Orden>('/ordenes', body)).data,
    onSuccess: (orden) => {
      qc.setQueryData(['orden', orden.id], orden)
      qc.invalidateQueries({ queryKey: ['mis-pedidos'] })
      // El stock cambió.
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['producto'] })
    },
  })
}

export const pedirFirmaWompi = async (ordenId: string) =>
  (await api.get<FirmaWompi>(`/pagos/wompi/firma/${ordenId}`)).data

export function useCotizarEnvio() {
  return useMutation({
    mutationFn: async (body: {
      departamento_destino: string
      ciudad_destino: string
      peso_total_kg: number
      valor_declarado?: number
    }) => (await api.post<CotizacionEnvio>('/envios/cotizar', body)).data,
  })
}

export function useRastreo() {
  return useMutation({
    mutationFn: async (guia: string) => (await api.get<Rastreo>(`/envios/rastreo/${encodeURIComponent(guia)}`)).data,
  })
}

/** POST /estadisticas/visita: alimenta la métrica de conversión del panel. Si falla no pasa nada. */
export const registrarVisita = (pagina: string) => {
  api.post('/estadisticas/visita', { pagina }).catch(() => {})
}
