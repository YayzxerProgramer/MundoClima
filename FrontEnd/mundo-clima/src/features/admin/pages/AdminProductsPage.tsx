import { useState } from "react";
import { Link } from "react-router";
import { Plus } from "lucide-react";
import { useProducts } from "../../catalog/hooks/queries";
import { useDebounce } from "../../../shared/hooks/use-debounce";
import {
  Badge,
  EmptyState,
  ErrorState,
  Input,
  LinkButton,
  Pagination,
  ProductImage,
  Skeleton,
} from "../../../shared/ui";
import { SEO } from "../../../shared/ui/SEO";
import { money } from "../../../shared/lib/format";
export default function AdminProductsPage() {
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    q = useDebounce(search);
  const query = useProducts({
    q,
    pagina: String(page),
    limite: "10",
    ordenarPor: "mas_recientes",
  });
  return (
    <>
      <SEO title="Administrar productos" noIndex />
      <div className="page-heading">
        <div>
          <p className="eyebrow">CATÁLOGO DE LA TIENDA</p>
          <h1>Productos</h1>
        </div>
        <LinkButton to="/admin/productos/nuevo">
          <Plus size={17} /> Nuevo producto
        </LinkButton>
      </div>
      <label className="sr-only" htmlFor="admin-product-search">
        Buscar productos por nombre o referencia
      </label>
      <Input
        id="admin-product-search"
        className="mb-6 max-w-md"
        placeholder="Buscar por nombre o referencia…"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
      />
      {query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Skeleton className="h-80" />
      ) : !query.data?.data.length ? (
        <EmptyState
          title="No encontramos productos"
          description="Prueba otra búsqueda o crea el primer producto."
        />
      ) : (
        <>
          <div className="data-table-wrap bg-surface">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Precio base</th>
                  <th>Stock</th>
                  <th>Ver</th>
                </tr>
              </thead>
              <tbody>
                {query.data.data.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="flex min-w-52 items-center gap-3">
                        <ProductImage
                          src={product.images[0]}
                          alt=""
                          className="h-12 w-12 rounded-sm bg-white object-contain"
                        />
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td className="text-xs">{product.sku}</td>
                    <td className="whitespace-nowrap tabular-nums">
                      {money(product.basePrice)}
                    </td>
                    <td>
                      <Badge
                        tone={
                          product.stock <= product.lowStock
                            ? "warning"
                            : "success"
                        }
                      >
                        {product.stock}
                      </Badge>
                    </td>
                    <td>
                      <Link
                        className="text-link text-xs"
                        to={`/producto/${product.slug}`}
                      >
                        Ver ficha
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={query.data.meta.page}
            pages={query.data.meta.pages}
            onChange={setPage}
          />
        </>
      )}
    </>
  );
}
