import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  ArrowRight,
  ChevronDown,
  Menu,
  ShoppingBag,
  UserRound,
  Truck,
  Moon,
  Sun,
  X,
} from "lucide-react";
import {
  useCategories,
  useProducts,
} from "../../features/catalog/hooks/queries";
import { CategoryIcon } from "../../features/catalog/components/CategoryIcon";
import type { Category } from "../../features/catalog/types";
import { useSession } from "../../features/auth/hooks/session";
import { roleLabel } from "../../features/auth/types";
import { useCart } from "../../features/cart/hooks/store";
import { useUI } from "../hooks/ui-store";
import {
  Badge,
  Button,
  Drawer,
  ErrorState,
  ProductImage,
  Skeleton,
} from "../ui";
import { money } from "../lib/format";
import { Search } from "./Search";
function CategoryPreview({
  category,
  close,
}: {
  category: Category;
  close: () => void;
}) {
  const query = useProducts({
    categoria: category.slug,
    limite: "4",
    ordenarPor: "destacados",
  });
  return (
    <div className="mega-preview">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3>{category.name}</h3>
          <p className="mt-2 text-sm text-muted">{category.description}</p>
        </div>
        <Link
          className="text-link whitespace-nowrap"
          to={`/categoria/${category.slug}`}
          onClick={close}
        >
          Ver todo <ArrowRight size={16} />
        </Link>
      </div>
      {category.children.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {category.children.map((child) => (
            <Link
              key={child.id}
              onClick={close}
              to={`/categoria/${child.slug}`}
              className="text-link"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}
      <div className="mt-5 grid grid-cols-4 gap-4">
        {query.isPending
          ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)
          : query.data?.data.map((product) => (
              <Link
                key={product.id}
                to={`/producto/${product.slug}`}
                onClick={close}
                className="text-sm"
              >
                <ProductImage
                  src={product.images[0]}
                  alt={product.name}
                  className="mb-3 aspect-square w-full rounded-control bg-white object-contain p-3"
                />
                <p className="line-clamp-2 text-xs">{product.name}</p>
                <strong className="mt-2 block text-sm tabular-nums">
                  {money(product.price)}
                </strong>
              </Link>
            ))}
      </div>
      {query.isError && (
        <p className="mt-4 text-sm text-muted">
          No pudimos cargar los destacados. Puedes abrir la categoría para
          reintentar.
        </p>
      )}
    </div>
  );
}
export function Header() {
  const categories = useCategories(),
    user = useSession((state) => state.user),
    count = useCart((state) =>
      state.items.reduce((sum, item) => sum + item.quantity, 0),
    );
  const [menu, setMenu] = useState(false),
    [mobile, setMobile] = useState(false),
    [active, setActive] = useState("");
  const [dark, setDark] = useState(
    () => localStorage.getItem("mundo-clima-theme") === "dark",
  );
  const container = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    location = useLocation();
  const selected =
    categories.data?.find((c) => c.id === active) ?? categories.data?.[0];
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("mundo-clima-theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setMenu(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  useEffect(() => {
    function close() {
      setMenu(false);
      setMobile(false);
    }
    const timer = setTimeout(close, 0);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);
  return (
    <>
      <div className="topbar">
        <div className="container-site">
          <p>El mundo del clima, en un solo lugar.</p>
          <div>
            <span className="hidden md:inline">
              Equipos · Repuestos · Insumos
            </span>
            <Link to="/rastreo">
              <Truck size={13} /> Sigue tu pedido
            </Link>
          </div>
        </div>
      </div>
      <header className="site-header">
        <div className="container-site header-main">
          <Button
            variant="ghost"
            className="icon-btn lg:hidden"
            aria-label="Abrir navegación"
            onClick={() => setMobile(true)}
          >
            <Menu size={22} />
          </Button>
          <Link
            to="/"
            aria-label="Mundo Clima, inicio"
            className="brand-lockup"
          >
            <img src="/brand/symbol.png" alt="" />
            <img src="/brand/wordmark.png" alt="Mundo Clima" />
          </Link>
          <div className="header-search">
            <Search />
          </div>
          <div className="header-actions">
            <button
              className="theme-toggle"
              onClick={() => setDark((v) => !v)}
              aria-label={dark ? "Activar tema claro" : "Activar tema oscuro"}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <Link to={user ? "/cuenta" : "/login"} className="account-link" aria-label={user ? "Mi cuenta" : "Ingresar a mi cuenta"}>
              <UserRound size={23} />
              <span>
                <small>
                  {user ? "Hola, " + user.name.split(" ")[0] : "Bienvenido"}
                </small>
                <strong>{user ? "Mi cuenta" : "Ingresa o regístrate"}</strong>
              </span>
            </Link>
            <button
              className="cart-trigger"
              aria-label={`Abrir carrito, ${count} productos`}
              onClick={() => useUI.getState().setCartOpen(true)}
            >
              <ShoppingBag size={24} />
              <span className="cart-count">{count}</span>
              <span className="hidden xl:inline">Mi carrito</span>
            </button>
          </div>
        </div>
        <div
          className="header-nav"
          ref={container}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setMenu(false);
              trigger.current?.focus();
            }
          }}
        >
          <div className="container-site nav-inner">
            <button
              ref={trigger}
              className="category-trigger"
              aria-expanded={menu}
              aria-controls="desktop-categories"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={18} /> : <Menu size={18} />} Todas las categorías{" "}
              <ChevronDown size={15} />
            </button>
            <nav aria-label="Navegación principal">
              <Link to="/categoria/aires-acondicionados">
                Aires acondicionados
              </Link>
              <Link to="/categoria/compresores">Compresores</Link>
              <Link to="/categoria/gases-refrigerantes">
                Gases refrigerantes
              </Link>
              <Link to="/categoria/herramientas">Herramientas</Link>
            </nav>
            <Link
              to={user ? "/cuenta" : "/registro"}
              className="professional-link"
            >
              {user?.role === "TECNICO" || user?.role === "DISTRIBUIDOR" ? (
                <Badge tone="blue">Cuenta {roleLabel[user.role]}</Badge>
              ) : (
                <>
                  Soy profesional <ArrowRight size={15} />
                </>
              )}
            </Link>
          </div>
          {menu && (
            <div className="mega-menu container-site" id="desktop-categories">
              <div className="mega-shell">
                {categories.isError ? (
                  <ErrorState
                    error={categories.error}
                    retry={() => void categories.refetch()}
                    compact
                  />
                ) : (
                  <>
                    <div className="mega-categories">
                      {categories.isPending ? (
                        <Skeleton className="h-60" />
                      ) : (
                        categories.data.map((category, index) => (
                          <Link
                            key={category.id}
                            id={`mega-category-${index}`}
                            to={`/categoria/${category.slug}`}
                            className={
                              selected?.id === category.id ? "is-active" : ""
                            }
                            onMouseEnter={() => setActive(category.id)}
                            onFocus={() => setActive(category.id)}
                            onClick={() => setMenu(false)}
                            onKeyDown={(event) => {
                              if (
                                event.key === "ArrowDown" ||
                                event.key === "ArrowUp"
                              ) {
                                event.preventDefault();
                                const next =
                                  (index +
                                    (event.key === "ArrowDown" ? 1 : -1) +
                                    categories.data.length) %
                                  categories.data.length;
                                document
                                  .getElementById(`mega-category-${next}`)
                                  ?.focus();
                              }
                            }}
                          >
                            <CategoryIcon slug={category.slug} size={19} />
                            <span>{category.name}</span>
                            <ArrowRight size={14} />
                          </Link>
                        ))
                      )}
                    </div>
                    {selected && (
                      <CategoryPreview
                        category={selected}
                        close={() => setMenu(false)}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
      <Drawer
        title="Explora Mundo Clima"
        open={mobile}
        onClose={() => setMobile(false)}
      >
        <nav className="mobile-nav">
          <Link to="/productos" onClick={() => setMobile(false)}>
            Todos los productos <ArrowRight size={17} />
          </Link>
          {categories.isError && (
            <ErrorState
              error={categories.error}
              retry={() => void categories.refetch()}
              compact
            />
          )}
          {categories.data?.map((category) => (
            <details key={category.id}>
              <summary>
                <CategoryIcon slug={category.slug} size={21} />
                {category.name}
                <ChevronDown size={16} />
              </summary>
              <p>{category.description}</p>
              {category.children.map((child) => (
                <Link
                  key={child.id}
                  to={`/categoria/${child.slug}`}
                  onClick={() => setMobile(false)}
                >
                  {child.name}
                </Link>
              ))}
              <Link
                to={`/categoria/${category.slug}`}
                onClick={() => setMobile(false)}
              >
                Ver todo <ArrowRight size={15} />
              </Link>
            </details>
          ))}
          <Link to="/cuenta" onClick={() => setMobile(false)}>
            Mi cuenta
          </Link>
          <Link to="/rastreo" onClick={() => setMobile(false)}>
            Sigue tu pedido
          </Link>
        </nav>
      </Drawer>
    </>
  );
}
