import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, Expand, ShieldCheck, ShoppingBag } from "lucide-react";
import { useProduct, useProducts } from "../../catalog/hooks/queries";
import { ProductCard } from "../../catalog/components/ProductCard";
import type { Product } from "../../catalog/types";
import { useSession } from "../../auth/hooks/session";
import { nivelParaRol } from "../../auth/types";
import { useCart } from "../../cart/hooks/store";
import { useUI } from "../../../shared/hooks/ui-store";
import {
  Badge,
  Breadcrumbs,
  Button,
  ErrorState,
  Modal,
  PriceTag,
  ProductImage,
  QuantityStepper,
  Skeleton,
  Tabs,
} from "../../../shared/ui";
import { SEO } from "../../../shared/ui/SEO";
import { money, number } from "../../../shared/lib/format";
import { ShippingEstimator } from "../components/ShippingEstimator";
function ProductDetail({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1),
    [imageIndex, setImageIndex] = useState(0),
    [zoom, setZoom] = useState(false);
  const user = useSession((state) => state.user),
    level = nivelParaRol(user?.role),
    inCart = useCart(
      (state) =>
        state.items.find((item) => item.productId === product.id)?.quantity ??
        0,
    );
  const tiers = product.tierPrices
    .filter((tier) => tier.level === level)
    .sort((a, b) => a.minimum - b.minimum);
  const specs = {
    ...product.specifications,
    ...(product.btu ? { "Capacidad (BTU)": number(product.btu) } : {}),
    ...(product.refrigerant ? { Refrigerante: product.refrigerant } : {}),
    ...(product.voltage ? { Voltaje: product.voltage } : {}),
    ...(product.equipmentType
      ? { "Tipo de equipo": product.equipmentType }
      : {}),
  };
  const available = product.active && product.stock > 0,
    remaining = Math.max(0, product.stock - inCart);
  const effectiveQuantity = Math.min(quantity, Math.max(1, remaining));
  const related = useProducts(
    { categoria: product.category?.slug, limite: "4" },
    !!product.category,
  );
  const origin = window.location.origin;
  function add() {
    useCart
      .getState()
      .add(product.id, Math.min(quantity, remaining), product.stock);
    useUI.getState().toast("Añadimos tu producto al carrito");
    useUI.getState().setCartOpen(true);
  }
  return (
    <>
      <SEO
        title={product.name}
        description={
          product.shortDescription ?? product.description ?? undefined
        }
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            sku: product.sku,
            image: product.images,
            description: product.shortDescription ?? product.description ?? "",
            brand: product.brand
              ? { "@type": "Brand", name: product.brand.name }
              : undefined,
            offers: {
              "@type": "Offer",
              priceCurrency: "COP",
              price: product.price,
              availability: available
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              url: `${origin}/producto/${product.slug}`,
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Inicio",
                item: origin,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: product.category?.name ?? "Catálogo",
                item: `${origin}/${product.category ? `categoria/${product.category.slug}` : "productos"}`,
              },
              { "@type": "ListItem", position: 3, name: product.name },
            ],
          },
        ]}
      />
      <Breadcrumbs
        items={[
          {
            label: product.category?.name ?? "Catálogo",
            to: product.category
              ? `/categoria/${product.category.slug}`
              : "/productos",
          },
          { label: product.name },
        ]}
      />
      <div className="pdp-layout">
        <div>
          <div className="pdp-image">
            <ProductImage
              src={product.images[imageIndex]}
              alt={product.name}
              eager
            />
            <Button
              className="icon-btn absolute bottom-4 right-4"
              variant="outline"
              disabled={!product.images.length}
              aria-label="Ampliar imagen"
              onClick={() => setZoom(true)}
            >
              <Expand size={20} />
            </Button>
          </div>
          {product.images.length > 1 && (
            <div className="pdp-thumbnails">
              {product.images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  aria-label={`Ver imagen ${index + 1}`}
                  aria-pressed={imageIndex === index}
                  onClick={() => setImageIndex(index)}
                >
                  <ProductImage src={image} alt="" />
                </button>
              ))}
            </div>
          )}
          <div className="mt-6 hidden items-center justify-center gap-3 text-xs text-muted lg:flex">
            <ShieldCheck size={18} /> Información clara para una compra con
            confianza
          </div>
        </div>
        <div className="pdp-info">
          <p className="eyebrow">
            {product.brand?.name ?? "Mundo Clima"}{" "}
            <span className="ml-2 font-normal text-muted">
              REF. {product.sku}
            </span>
          </p>
          <h1>{product.name}</h1>
          <p className="mb-5 mt-4 text-sm leading-7 text-muted">
            {product.shortDescription ?? product.description}
          </p>
          <PriceTag product={product} large />
          <p className="mt-2 text-xs text-muted">
            Precio por {product.unit} · Moneda COP
          </p>
          <div className="my-5">
            {!available ? (
              <Badge tone="danger">Agotado</Badge>
            ) : product.stock <= product.lowStock ? (
              <Badge tone="warning">¡Últimas {product.stock} unidades!</Badge>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-success">
                <Check size={15} /> Disponible · {product.stock} unidades
              </span>
            )}
          </div>
          <div className="mb-6 flex flex-wrap gap-3">
            <QuantityStepper
              value={Math.min(quantity, Math.max(1, remaining))}
              max={remaining}
              onChange={setQuantity}
            />
            <Button
              variant="buy"
              className="flex-1"
              disabled={!available || remaining < 1}
              onClick={add}
            >
              <ShoppingBag size={19} />
              {!available
                ? "Agotado"
                : remaining < 1
                  ? "Stock máximo en carrito"
                  : "Agregar al carrito"}
            </Button>
          </div>
          {tiers.length > 0 && (
            <div className="mb-6 rounded-control border p-4">
              <h3 className="mb-3 text-sm">Compra más, paga menos</h3>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Cantidad mínima</th>
                      <th>Precio por unidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiers.map((tier) => (
                      <tr key={tier.id}>
                        <td>{tier.minimum} unidades</td>
                        <td className="font-semibold tabular-nums">
                          {money(tier.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">
                Tarifas informadas para tu nivel. El precio aplicado y el total
                se confirman al crear el pedido.
              </p>
            </div>
          )}
          {!user && (
            <p className="mb-6 rounded-control bg-primary/5 p-4 text-xs leading-6">
              ¿Eres técnico o distribuidor?{" "}
              <Link
                to={`/login?redirect=${encodeURIComponent(`/producto/${product.slug}`)}`}
                className="text-link text-xs"
              >
                Ingresa para consultar tu precio.
              </Link>
            </p>
          )}
          <ShippingEstimator
            key={`${quantity}-${product.id}`}
            weight={product.weight * effectiveQuantity}
            value={product.price * effectiveQuantity}
          />
        </div>
      </div>
      <section className="my-10 rounded-card border bg-surface p-5 md:p-8">
        <Tabs
          items={[
            {
              id: "description",
              label: "Descripción",
              content: (
                <p className="whitespace-pre-line text-muted">
                  {product.description ||
                    "Consulta las especificaciones disponibles para conocer este producto."}
                </p>
              ),
            },
            {
              id: "technical",
              label: "Ficha técnica",
              content: Object.keys(specs).length ? (
                <dl className="specification-list">
                  {Object.entries(specs).map(([key, value]) => (
                    <div key={key}>
                      <dt>{key.replaceAll("_", " ")}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-muted">
                  Aún no hay especificaciones adicionales disponibles.
                </p>
              ),
            },
          ]}
        />
      </section>
      {!!related.data?.data.filter((item) => item.id !== product.id).length && (
        <section className="page-section">
          <div className="section-title">
            <h2>Para completar tu proyecto</h2>
            <Link
              className="text-link"
              to={`/categoria/${product.category?.slug}`}
            >
              Ver categoría
            </Link>
          </div>
          <div className="product-grid">
            {related.data.data
              .filter((item) => item.id !== product.id)
              .map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
          </div>
        </section>
      )}
      <Modal title={product.name} open={zoom} onClose={() => setZoom(false)}>
        <p className="mb-3 text-xs text-muted">Desplaza la imagen para ver los detalles.</p>
        <div className="product-zoom" tabIndex={0} aria-label="Imagen ampliada, desplazable">
        <ProductImage
          src={product.images[imageIndex]}
          alt={product.name}
          className="zoom-image"
        />
        </div>
      </Modal>
    </>
  );
}
export default function ProductPage() {
  const { slug } = useParams(),
    query = useProduct(slug);
  return (
    <div className="container-site pb-8">
      {query.isError ? (
        <div className="py-10">
          <ErrorState error={query.error} retry={() => void query.refetch()} />
        </div>
      ) : query.isPending ? (
        <div className="pdp-layout py-10">
          <Skeleton className="aspect-square" />
          <div>
            <Skeleton className="h-16" />
            <Skeleton className="mt-6 h-64" />
          </div>
        </div>
      ) : (
        <ProductDetail key={query.data.id} product={query.data} />
      )}
    </div>
  );
}
