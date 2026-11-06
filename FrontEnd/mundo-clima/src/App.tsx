import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router'
import { AdminLayout } from './components/layout/AdminLayout'
import { Layout } from './components/layout/Layout'
import { Spinner } from './components/ui/basicos'
import { destinoSeguro } from './lib/rutas'
import { useAuth, useEsAdmin } from './store/auth'

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
const Ayuda = lazy(() => import('./pages/Ayuda'))
const AdminResumen = lazy(() => import('./pages/admin/Resumen'))
const AdminPedidos = lazy(() => import('./pages/admin/Pedidos'))
const AdminProductos = lazy(() => import('./pages/admin/Productos'))
const AdminNuevoProducto = lazy(() => import('./pages/admin/NuevoProducto'))
const AdminUsuarios = lazy(() => import('./pages/admin/Usuarios'))

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
  const esAdmin = useEsAdmin()
  const [sp] = useSearchParams()
  const redirect = sp.get('redirect')
  if (!token) return children
  return <Navigate to={esAdmin && !redirect ? '/admin' : destinoSeguro(redirect)} replace />
}

/** El panel es solo para administradores; el resto de cuentas vuelve al inicio. */
function SoloAdmin({ children }: { children: ReactNode }) {
  const esAdmin = useEsAdmin()
  return esAdmin ? children : <Navigate to="/" replace />
}

/** Los administradores gestionan la tienda y no compran: carrito y checkout los llevan al panel. */
function SinAdmin({ children }: { children: ReactNode }) {
  const esAdmin = useEsAdmin()
  return esAdmin ? <Navigate to="/admin" replace /> : children
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
          <Route path="carrito" element={<SinAdmin><Carrito /></SinAdmin>} />
          <Route path="ingresar" element={<SoloInvitado><Ingresar /></SoloInvitado>} />
          <Route path="registro" element={<SoloInvitado><Registro /></SoloInvitado>} />
          <Route path="checkout" element={<Protegida><SinAdmin><Checkout /></SinAdmin></Protegida>} />
          <Route path="cuenta" element={<Protegida><Cuenta tab="perfil" /></Protegida>} />
          <Route path="cuenta/pedidos" element={<Protegida><Cuenta tab="pedidos" /></Protegida>} />
          <Route path="pedidos/:id" element={<Protegida><Pedido /></Protegida>} />
          <Route path="pedidos/:id/resultado" element={<Protegida><ResultadoPago /></Protegida>} />
          <Route path="rastreo" element={<Rastreo />} />
          <Route path="rastreo/:guia" element={<Rastreo />} />
          <Route path="ayuda" element={<Ayuda />} />
          <Route path="admin" element={<Protegida><SoloAdmin><AdminLayout /></SoloAdmin></Protegida>}>
            <Route index element={<AdminResumen />} />
            <Route path="pedidos" element={<AdminPedidos />} />
            <Route path="productos" element={<AdminProductos />} />
            <Route path="productos/nuevo" element={<AdminNuevoProducto />} />
            <Route path="usuarios" element={<AdminUsuarios />} />
          </Route>
          <Route path="*" element={<NoEncontrado />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
