import { useQuery } from "@tanstack/react-query";
import { useSession } from "../../auth/hooks/session";
import { nivelParaRol } from "../../auth/types";
import {
  buildProductQuery,
  getBrands,
  getCategories,
  getFilters,
  getProduct,
  getProducts,
} from "../api/catalog";
import type { ProductQuery } from "../types";
export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 300000,
  });
export const useBrands = () =>
  useQuery({ queryKey: ["brands"], queryFn: getBrands, staleTime: 300000 });
export const useFilters = () =>
  useQuery({ queryKey: ["filters"], queryFn: getFilters });
export function useProducts(params: ProductQuery, enabled = true) {
  const categories = useCategories(),
    brands = useBrands();
  const { user, token, revision } = useSession();
  const level = nivelParaRol(user?.role);
  const ready =
    (!params.categoria || categories.isSuccess) &&
    (!params.marca || brands.isSuccess) &&
    (!token || !!user);
  const query = useQuery({
    queryKey: [
      "products",
      revision,
      level,
      params,
      categories.data?.map((c) => c.id),
      brands.data?.map((b) => b.id),
    ],
    queryFn: ({ signal }) =>
      getProducts(
        buildProductQuery(
          params,
          categories.data ?? [],
          brands.data ?? [],
          level,
        ),
        signal,
      ),
    enabled: enabled && ready,
  });
  const dependencyError =
    params.categoria && categories.isError
      ? categories.error
      : params.marca && brands.isError
        ? brands.error
        : null;
  return {
    ...query,
    error: dependencyError ?? query.error,
    isError: !!dependencyError || query.isError,
    refetch: () => {
      if (dependencyError) {
        void categories.refetch();
        void brands.refetch();
      }
      return query.refetch();
    },
  };
}
export function useProduct(id?: string) {
  const { user, token, revision } = useSession();
  return useQuery({
    queryKey: ["product", revision, id],
    queryFn: ({ signal }) => getProduct(id!, nivelParaRol(user?.role), signal),
    enabled: !!id && (!token || !!user),
  });
}
