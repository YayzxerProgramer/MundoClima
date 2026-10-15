import { useQueries } from "@tanstack/react-query";
import { getProduct } from "../../catalog/api/catalog";
import { useSession } from "../../auth/hooks/session";
import { nivelParaRol } from "../../auth/types";
import { useCart } from "./store";
export function useCartDetails() {
  const items = useCart((state) => state.items);
  const { revision, user, token } = useSession();
  const queries = useQueries({
    queries: items.map((item) => ({
      queryKey: ["product", revision, item.productId],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getProduct(item.productId, nivelParaRol(user?.role), signal),
      enabled: !token || !!user,
    })),
  });
  const lines = items.map((item, index) => ({
    ...item,
    product: queries[index].data,
    error: queries[index].error,
  }));
  const loading = queries.some((query) => query.isPending);
  const invalid = lines.some(
    (line) =>
      !line.product ||
      !line.product.active ||
      line.product.stock < line.quantity,
  );
  return {
    lines,
    loading,
    invalid,
    subtotal: lines.reduce(
      (sum, line) => sum + (line.product?.price ?? 0) * line.quantity,
      0,
    ),
    weight: lines.reduce(
      (sum, line) => sum + (line.product?.weight ?? 0) * line.quantity,
      0,
    ),
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  };
}
