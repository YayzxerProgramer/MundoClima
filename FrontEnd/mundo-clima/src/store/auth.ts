import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario } from '../types/api'

interface EstadoAuth {
  token: string | null
  usuario: Usuario | null
  iniciarSesion: (token: string, usuario: Usuario) => void
  actualizarUsuario: (usuario: Usuario) => void
  cerrarSesion: () => void
}

export const useAuth = create<EstadoAuth>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      iniciarSesion: (token, usuario) => set({ token, usuario }),
      actualizarUsuario: (usuario) => set({ usuario }),
      cerrarSesion: () => set({ token: null, usuario: null }),
    }),
    { name: 'mc-auth' },
  ),
)

/** Las cuentas de administrador gestionan la tienda: no compran. */
export const useEsAdmin = () => useAuth((s) => s.usuario?.rol === 'ADMIN')
