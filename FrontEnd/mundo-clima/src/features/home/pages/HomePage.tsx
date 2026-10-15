import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  House,
  Wrench,
  Truck,
  ShieldCheck,
  Headphones,
  Snowflake,
} from "lucide-react";
import { SEO } from "../../../shared/ui/SEO";
import {
  ErrorState,
  LinkButton,
  ProductSkeletons,
  Skeleton,
  EmptyState,
} from "../../../shared/ui";
import {
  useCategories,
  useProducts,
  useBrands,
} from "../../catalog/hooks/queries";
import { CategoryIcon } from "../../catalog/components/CategoryIcon";
import { ProductCard } from "../../catalog/components/ProductCard";
export default function HomePage() {
  const categories = useCategories(),
    products = useProducts({ ordenarPor: "destacados", limite: "4" }),
    brands = useBrands();
  return (
    <>
      <SEO title="Tu mundo, a la temperatura ideal" />
      <div className="container-site">
        <section className="home-hero">
          <div className="hero-copy">
            <span className="hero-overline">
              <Snowflake size={16} /> EL CONFORT EMPIEZA AQUÍ
            </span>
            <h1>
              Tu mundo, a la
              <br />
              <span>temperatura ideal.</span>
            </h1>
            <p>
              Soluciones de climatización y refrigeración para tu hogar, tu
              negocio y cada uno de tus proyectos.
            </p>
            <LinkButton to="/categoria/aires-acondicionados" variant="buy">
              Encuentra tu aire ideal <ArrowRight size={18} />
            </LinkButton>
            <div className="hero-note">
              <span />
              <p>
                Equipos, repuestos e insumos.
                <br />
                <strong>Todo en un solo lugar.</strong>
              </p>
            </div>
          </div>
          <div className="hero-image">
            <img
              src="/images/hero-comfort.svg"
              alt="Sala luminosa con aire acondicionado mini split, sofá y plantas"
              loading="eager"
            />
            <div className="hero-caption">
              <span>
                <Snowflake size={21} />
              </span>
              <div>
                <strong>Más confort. Más vida.</strong>
                <p>Haz de cada espacio tu lugar favorito.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="trust-strip" aria-label="Beneficios de compra">
          <div>
            <Truck />
            <span>
              <strong>Envíos en Colombia</strong>
              <small>Cotiza hasta tu ciudad</small>
            </span>
          </div>
          <div>
            <ShieldCheck />
            <span>
              <strong>Compra con confianza</strong>
              <small>Pago en línea con Wompi</small>
            </span>
          </div>
          <div>
            <Wrench />
            <span>
              <strong>Precios para profesionales</strong>
              <small>Técnicos y distribuidores</small>
            </span>
          </div>
          <div>
            <Headphones />
            <span>
              <strong>Encuentra tu solución</strong>
              <small>Información técnica en cada producto</small>
            </span>
          </div>
        </section>
        <section className="page-section">
          <div className="section-title">
            <div>
              <p className="eyebrow">TODO LO QUE NECESITAS</p>
              <h2>Un mundo de soluciones</h2>
            </div>
            <Link to="/productos" className="text-link">
              Ver catálogo <ArrowRight size={16} />
            </Link>
          </div>
          {categories.isError ? (
            <ErrorState
              error={categories.error}
              retry={() => void categories.refetch()}
              compact
            />
          ) : (
            <div className="category-grid">
              {categories.isPending
                ? Array.from({ length: 7 }, (_, i) => (
                    <Skeleton className="h-36" key={i} />
                  ))
                : categories.data.map((category) => (
                    <Link
                      key={category.id}
                      to={`/categoria/${category.slug}`}
                      className="category-tile"
                    >
                      <span>
                        <CategoryIcon slug={category.slug} size={31} />
                      </span>
                      <h3>{category.name}</h3>
                      <ArrowUpRight size={14} />
                    </Link>
                  ))}
            </div>
          )}
        </section>
        <section className="audience-grid">
          <Link
            to="/categoria/aires-acondicionados"
            className="audience-card audience-home"
          >
            <div className="audience-icon">
              <House size={25} />
            </div>
            <div>
              <p className="eyebrow">HOGAR Y COMERCIO</p>
              <h2>
                El mejor ambiente
                <br />
                para tu día a día.
              </h2>
              <p>Encuentra el aire acondicionado que tu espacio necesita.</p>
              <span>
                Descubrir equipos <ArrowRight size={17} />
              </span>
            </div>
            <Snowflake className="audience-watermark" strokeWidth={0.7} />
          </Link>
          <Link to="/productos" className="audience-card audience-pro">
            <div className="audience-icon">
              <Wrench size={25} />
            </div>
            <div>
              <p className="eyebrow">TÉCNICOS Y DISTRIBUIDORES</p>
              <h2>
                Tu experiencia.
                <br />
                Nuestro respaldo.
              </h2>
              <p>Repuestos, gases y herramientas para trabajos bien hechos.</p>
              <span>
                Explorar línea profesional <ArrowRight size={17} />
              </span>
            </div>
            <Wrench className="audience-watermark" strokeWidth={0.7} />
          </Link>
        </section>
        <section className="page-section">
          <div className="section-title">
            <div>
              <p className="eyebrow">EQUIPA TU PRÓXIMO PROYECTO</p>
              <h2>Destacados para ti</h2>
            </div>
            <Link to="/productos?ordenarPor=destacados" className="text-link">
              Ver todos <ArrowRight size={16} />
            </Link>
          </div>
          {products.isError ? (
            <ErrorState
              error={products.error}
              retry={() => void products.refetch()}
            />
          ) : products.isPending ? (
            <ProductSkeletons />
          ) : products.data?.data.length ? (
            <div className="product-grid">
              {products.data.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Estamos preparando el catálogo"
              description="Pronto encontrarás aquí los productos disponibles."
            />
          )}
        </section>
        <section className="professional-banner">
          <div className="professional-art">
            <img src="/brand/symbol-white.png" alt="" />
          </div>
          <div>
            <p className="eyebrow">CRECEMOS CONTIGO</p>
            <h2>
              Tu trabajo merece
              <br />
              un precio especial.
            </h2>
            <p>
              Si eres técnico o distribuidor, crea tu cuenta y consulta los
              precios disponibles para tu nivel.
            </p>
          </div>
          <div className="professional-cta">
            <LinkButton to="/registro" variant="buy">
              Crear cuenta profesional <ArrowRight size={17} />
            </LinkButton>
            <Link to="/login">Ya tengo una cuenta</Link>
          </div>
        </section>
        {!!brands.data?.length && (
          <section className="brands-section">
            <p>Marcas que forman parte de nuestro catálogo</p>
            <div>
              {brands.data.map((brand) => (
                <Link key={brand.id} to={`/productos?marca=${brand.slug}`}>
                  {brand.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
