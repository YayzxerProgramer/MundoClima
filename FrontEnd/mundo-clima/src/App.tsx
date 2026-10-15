import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router'
import { Layout } from './components/layout/Layout'
import { Spinner } from './components/ui/basicos'
import { destinoSeguro } from './lib/rutas'
import { useAuth } from './store/auth'

const Inicio = lazy(() => import('./pages/Inicio'))
const Catalogo = lazy(() => import('./pages/Catalogo'))
const Producto = lazy(() => import('./pages/Producto'))
const Carrito = lazy(() => import('./pages/Carrito'))
const Ingresar = lazy(() => import('./pages/Ingresar'))
const Registro = lazy(() => import('./pages/Registro'))
const Checkout = lazy(() => import('./pages/Checkout'))
const ResultadoPago = lazy(() => import('./pages/ResultadoPago'))
const Cuenta = lazy(() => import('./pages/Cuenta'))
const Pedido = lazy(() => import('./pages/Pedido'))
const Rastreo = lazy(() => import('./pages/Rastreo'))
const NoEncontrado = lazy(() => import('./pages/NoEncontrado'))

/** Checkout, resultado, cuenta y pedidos piden sesión: se manda a /ingresar y se vuelve aquí. */
function Protegida({ children }: { children: ReactNode }) {
  const token = useAuth((s) => s.token)
  const { pathname, search } = useLocation()
  if (!token) return <Navigate to={`/ingresar?redirect=${encodeURIComponent(pathname + search)}`} replace />
  return children
}

/**
 * Con sesión, /ingresar y /registro no aplican. También es lo que redirige justo después de
 * iniciar sesión o registrarse: vuelve a ?redirect= (p. ej. el checkout) o al inicio.
 */
function SoloInvitado({ children }: { children: ReactNode }) {
  const token = useAuth((s) => s.token)
  const [sp] = useSearchParams()
  return token ? <Navigate to={destinoSeguro(sp.get('redirect'))} replace /> : children
}

const cargando = (
  <div className="grid min-h-[50vh] place-items-center">
    <Spinner size={36} color="#084B75" />
  </div>
)

export default function App() {
  return (
    <Suspense fallback={cargando}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="productos" element={<Catalogo />} />
          <Route path="producto/:slug" element={<Producto />} />
          <Route path="carrito" element={<Carrito />} />
          <Route path="ingresar" element={<SoloInvitado><Ingresar /></SoloInvitado>} />
          <Route path="registro" element={<SoloInvitado><Registro /></SoloInvitado>} />
          <Route path="checkout" element={<Protegida><Checkout /></Protegida>} />
          <Route path="cuenta" element={<Protegida><Cuenta tab="perfil" /></Protegida>} />
          <Route path="cuenta/pedidos" element={<Protegida><Cuenta tab="pedidos" /></Protegida>} />
          <Route path="pedidos/:id" element={<Protegida><Pedido /></Protegida>} />
          <Route path="pedidos/:id/resultado" element={<Protegida><ResultadoPago /></Protegida>} />
          <Route path="rastreo" element={<Rastreo />} />
          <Route path="rastreo/:guia" element={<Rastreo />} />
          <Route path="*" element={<NoEncontrado />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
