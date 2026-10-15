import { Link } from "react-router";
import { Trash2 } from "lucide-react";
import { useCartDetails } from "../hooks/use-cart";
import { useCart } from "../hooks/store";
import {
  Button,
  EmptyState,
  LinkButton,
  PriceTag,
  ProductImage,
  QuantityStepper,
  Skeleton,
} from "../../../shared/ui";
import { money } from "../../../shared/lib/format";
import { useUI } from "../../../shared/hooks/ui-store";
export function CartContents({ compact = false }: { compact?: boolean }) {
  const cart = useCartDetails(),
    { setQuantity, remove } = useCart();
  const close = () => useUI.getState().setCartOpen(false);
  if (!cart.lines.length)
    return (
      <EmptyState
        title="Aquí comienza tu próximo proyecto"
        description="Tu carrito está vacío. Explora el catálogo y encuentra lo que necesitas."
      >
        <div onClick={close}>
          <LinkButton to="/productos">Explorar productos</LinkButton>
        </div>
      </EmptyState>
    );
  return (
    <div className={compact ? "cart-compact" : "cart-layout"}>
      <div className="cart-lines">
        {cart.lines.map((line) => (
          <article className="cart-line" key={line.productId}>
            {line.product ? (
              <>
                <Link to={`/producto/${line.product.slug}`} onClick={close}>
                  <ProductImage
                    src={line.product.images[0]}
                    alt={line.product.name}
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-[10px] uppercase text-muted">
                    {line.product.brand?.name}
                  </p>
                  <Link to={`/producto/${line.product.slug}`} onClick={close}>
                    <h3>{line.product.name}</h3>
                  </Link>
                  <PriceTag product={line.product} />
                  {line.quantity > line.product.stock && (
                    <p role="alert" className="mt-2 text-xs text-danger">
                      Solo hay {line.product.stock} unidades. Actualiza la
                      cantidad.
                    </p>
                  )}
                  {!line.product.active && (
                    <p role="alert" className="mt-2 text-xs text-danger">
                      Este producto ya no está disponible.
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <QuantityStepper
                      value={line.quantity}
                      max={line.product.stock}
                      onChange={(quantity) =>
                        setQuantity(
                          line.productId,
                          quantity,
                          line.product!.stock,
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      className="icon-btn text-muted"
                      aria-label={`Quitar ${line.product.name}`}
                      onClick={() => remove(line.productId)}
                    >
                      <Trash2 size={17} />
                    </Button>
                  </div>
                </div>
              </>
            ) : line.error ? (
              <div className="grid gap-3 text-sm">
                <p>No pudimos consultar un producto de tu carrito.</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => void cart.refetch()}>
                    Reintentar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => remove(line.productId)}
                  >
                    Quitar
                  </Button>
                </div>
              </div>
            ) : (
              <Skeleton className="h-32 w-full" />
            )}
          </article>
        ))}
      </div>
      <div className="cart-summary">
        <h2>Resumen de tu compra</h2>
        <div className="summary-row mt-5">
          <span>Productos</span>
          <strong className="tabular-nums">
            {cart.loading ? "Consultando…" : money(cart.subtotal)}
          </strong>
        </div>
        <div className="summary-row mt-3 text-muted">
          <span>Envío</span>
          <span>Por confirmar</span>
        </div>
        <p className="my-5 border-t pt-4 text-xs leading-6 text-muted">
          Los precios y la disponibilidad se vuelven a consultar al continuar.
          Podrás cotizar el envío con tu dirección.
        </p>
        {cart.invalid && !cart.loading && (
          <p className="mb-4 text-xs text-danger" role="alert">
            Revisa los productos sin disponibilidad antes de continuar.
          </p>
        )}
        <div onClick={close}>
          {cart.invalid || cart.loading ? (
            <Button variant="buy" className="w-full" disabled>
              Continuar compra
            </Button>
          ) : (
            <LinkButton variant="buy" className="w-full" to="/checkout">
              Continuar compra
            </LinkButton>
          )}
        </div>
        <div className="mt-4 text-center" onClick={close}>
          <Link
            className="text-link text-xs"
            to={compact ? "/carrito" : "/productos"}
          >
            {compact ? "Ver mi carrito" : "Seguir explorando"}
          </Link>
        </div>
      </div>
    </div>
  );
}
