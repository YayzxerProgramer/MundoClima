import { useEffect, useRef, type ReactNode } from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { queryClient } from "../shared/lib/query";
import { api } from "../shared/lib/api";
import { Header } from "../shared/layout/Header";
import { Footer } from "../shared/layout/Footer";
import { useSession } from "../features/auth/hooks/session";
import { getProfile, logout } from "../features/auth/api/auth";
import { useUI } from "../shared/hooks/ui-store";
import {
  Button,
  Drawer,
  EmptyState,
  ErrorState,
  LinkButton,
  Skeleton,
  Toasts,
} from "../shared/ui";
import { CartContents } from "../features/cart/components/CartContents";
import { AdminLayout } from "../features/admin/components/AdminLayout";
import ErrorPage from "../features/system/pages/ErrorPage";
function SessionRestore({ children }: { children: ReactNode }) {
  const { token, user, revision, setUser } = useSession();
  const profile = useQuery({
    queryKey: ["profile", revision],
    queryFn: getProfile,
    enabled: !!token && !user,
    retry: false,
  });
  useEffect(() => {
    if (profile.data && token && !user) setUser(profile.data);
  }, [profile.data, token, user, setUser]);
  if (token && !user)
    return (
      <div className="container-site page-section">
        {profile.isError ? (
          <>
            <ErrorState
              error={profile.error}
              retry={() => void profile.refetch()}
            />
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={logout}>
                Continuar sin sesión
              </Button>
            </div>
          </>
        ) : (
          <Skeleton className="h-96" />
        )}
      </div>
    );
  return children;
}
function RouteEvents() {
  const location = useLocation(),
    navigate = useNavigate(),
    visited = useRef("");
  useEffect(() => {
    const expired = () => {
      const from = location.pathname + location.search;
      queryClient.clear();
      if (!["/login", "/registro"].includes(location.pathname))
        navigate(`/login?redirect=${encodeURIComponent(from)}`, {
          replace: true,
        });
    };
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, [location, navigate]);
  useEffect(() => {
    if (visited.current === location.pathname) return;
    visited.current = location.pathname;
    window.scrollTo({ top: 0, behavior: "instant" });
    void api
      .post("/estadisticas/visita", { pagina: location.pathname })
      .catch(() => undefined);
  }, [location.pathname]);
  return null;
}
function Layout() {
  const { cartOpen, setCartOpen } = useUI();
  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <RouteEvents />
      <SessionRestore>
        <Header />
        <main id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <Footer />
        <Drawer
          open={cartOpen}
          title="Mi carrito"
          onClose={() => setCartOpen(false)}
        >
          {cartOpen && <CartContents compact />}
        </Drawer>
      </SessionRestore>
      <Toasts />
    </>
  );
}
function RequireAuth({ admin = false }: { admin?: boolean }) {
  const { token, user } = useSession(),
    location = useLocation();
  if (!token)
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  if (!user) return <Skeleton className="m-8 h-80" />;
  if (admin && user.role !== "ADMIN")
    return (
      <div className="container-site page-section">
        <EmptyState
          title="Esta sección es para administradores"
          description="Puedes continuar explorando la tienda con tu cuenta."
        >
          <LinkButton to="/cuenta">Volver a mi cuenta</LinkButton>
        </EmptyState>
      </div>
    );
  return <Outlet />;
}
const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        lazy: async () => ({
          Component: (await import("../features/home/pages/HomePage")).default,
        }),
      },
      {
        path: "productos",
        lazy: async () => ({
          Component: (await import("../features/catalog/pages/CatalogPage"))
            .default,
        }),
      },
      {
        path: "categoria/:slug",
        lazy: async () => ({
          Component: (await import("../features/catalog/pages/CatalogPage"))
            .default,
        }),
      },
      {
        path: "producto/:slug",
        lazy: async () => ({
          Component: (await import("../features/product/pages/ProductPage"))
            .default,
        }),
      },
      {
        path: "carrito",
        lazy: async () => ({
          Component: (await import("../features/cart/pages/CartPage")).default,
        }),
      },
      {
        path: "login",
        lazy: async () => {
          const Page = (await import("../features/auth/pages/AuthPage"))
            .default;
          return { element: <Page key="login" /> };
        },
      },
      {
        path: "registro",
        lazy: async () => {
          const Page = (await import("../features/auth/pages/AuthPage"))
            .default;
          return { element: <Page key="register" /> };
        },
      },
      {
        path: "rastreo",
        lazy: async () => ({
          Component: (await import("../features/orders/pages/TrackingPage"))
            .default,
        }),
      },
      {
        path: "ayuda",
        lazy: async () => ({
          Component: (await import("../features/system/pages/HelpPage"))
            .default,
        }),
      },
      {
        element: <RequireAuth />,
        children: [
          {
            path: "checkout",
            lazy: async () => ({
              Component: (
                await import("../features/checkout/pages/CheckoutPage")
              ).default,
            }),
          },
          {
            path: "checkout/resultado/:id",
            lazy: async () => ({
              Component: (
                await import("../features/checkout/pages/PaymentResultPage")
              ).default,
            }),
          },
          {
            path: "cuenta",
            lazy: async () => ({
              Component: (await import("../features/account/pages/AccountPage"))
                .default,
            }),
          },
          {
            path: "cuenta/pedidos",
            lazy: async () => ({
              Component: (await import("../features/orders/pages/OrdersPage"))
                .default,
            }),
          },
          {
            path: "cuenta/pedidos/:id",
            lazy: async () => ({
              Component: (
                await import("../features/orders/pages/OrderDetailPage")
              ).default,
            }),
          },
          {
            element: <RequireAuth admin />,
            children: [
              {
                path: "admin",
                element: <AdminLayout />,
                children: [
                  {
                    index: true,
                    lazy: async () => ({
                      Component: (
                        await import("../features/admin/pages/DashboardPage")
                      ).default,
                    }),
                  },
                  {
                    path: "pedidos",
                    lazy: async () => ({
                      Component: (
                        await import("../features/admin/pages/AdminOrdersPage")
                      ).default,
                    }),
                  },
                  {
                    path: "productos",
                    lazy: async () => ({
                      Component: (
                        await import("../features/admin/pages/AdminProductsPage")
                      ).default,
                    }),
                  },
                  {
                    path: "productos/nuevo",
                    lazy: async () => ({
                      Component: (
                        await import("../features/admin/pages/NewProductPage")
                      ).default,
                    }),
                  },
                  {
                    path: "usuarios",
                    lazy: async () => ({
                      Component: (
                        await import("../features/admin/pages/AdminUsersPage")
                      ).default,
                    }),
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: "*",
        lazy: async () => ({
          Component: (await import("../features/system/pages/NotFoundPage"))
            .default,
        }),
      },
    ],
  },
]);
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <RouterProvider
          router={router}
          future={{ v7_startTransition: true }}
          fallbackElement={
            <div className="container-site page-section">
              <Skeleton className="h-96" />
            </div>
          }
        />
      </HelmetProvider>
    </QueryClientProvider>
  );
}
