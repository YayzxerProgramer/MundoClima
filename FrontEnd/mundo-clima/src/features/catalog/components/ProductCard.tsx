import { Link } from "react-router-dom";
import { ShoppingBag, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import type { Product } from "../types";
import { Badge, Button, PriceTag, ProductImage } from "../../../shared/ui";
import { useCart } from "../../cart/hooks/store";
import { useUI } from "../../../shared/hooks/ui-store";
import { number } from "../../../shared/lib/format";
export function ProductCard({ product }: { product: Product }) {
  const [added, setAdded] = useState(false),
    reduced = useReducedMotion();
  const existing = useCart(
    (state) =>
      state.items.find((item) => item.productId === product.id)?.quantity ?? 0,
  );
  const unavailable = !product.active || product.stock < 1;
  function add() {
    useCart.getState().add(product.id, 1, product.stock);
    setAdded(true);
    useUI.getState().toast("Producto añadido a tu carrito");
    window.setTimeout(() => setAdded(false), 1600);
  }
  return (
    <motion.article
      className="product-card"
      whileHover={reduced ? undefined : { y: -3 }}
    >
      <Link to={`/producto/${product.slug}`} className="product-picture">
        <ProductImage src={product.images[0]} alt={product.name} />
        {unavailable && (
          <span className="absolute left-3 top-3">
            <Badge>Agotado</Badge>
          </span>
        )}
      </Link>
      <div className="product-copy">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
          {product.brand?.name ?? product.category?.name ?? "Mundo Clima"}
        </p>
        <Link to={`/producto/${product.slug}`}>
          <h3>{product.name}</h3>
        </Link>
        <div className="product-specs">
          {product.btu && <span>{number(product.btu)} BTU</span>}
          {product.voltage && <span>{product.voltage}</span>}
          {product.refrigerant && <span>{product.refrigerant}</span>}
        </div>
        <PriceTag product={product} />
        <p className="mb-4 mt-2 min-h-4 text-xs text-muted">
          {unavailable
            ? "Por ahora sin disponibilidad"
            : product.stock <= product.lowStock
              ? `¡Últimas ${product.stock} unidades!`
              : `Por ${product.unit}`}
        </p>
        <Button
          variant="outline"
          className="w-full px-2"
          disabled={unavailable || existing >= product.stock}
          onClick={add}
        >
          {added ? <Check size={16} /> : <ShoppingBag size={16} />}
          <span>
            {unavailable
              ? "Agotado"
              : existing >= product.stock
                ? "Máximo en carrito"
                : added
                  ? "Añadido"
                  : "Agregar"}
          </span>
        </Button>
      </div>
    </motion.article>
  );
}
