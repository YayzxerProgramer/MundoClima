import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search as SearchIcon, ArrowUpRight } from "lucide-react";
import { useDebounce } from "../hooks/use-debounce";
import { useProducts } from "../../features/catalog/hooks/queries";
import { money } from "../lib/format";
import { ProductImage } from "../ui";
export function Search() {
  const [value, setValue] = useState(""),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(-1);
  const ref = useRef<HTMLDivElement>(null),
    navigate = useNavigate(),
    q = useDebounce(value.trim());
  const query = useProducts({ q, limite: "5" }, open && q.length >= 2);
  const products = query.data?.data ?? [];
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  const search = () => {
    if (value.trim()) {
      navigate(`/productos?q=${encodeURIComponent(value.trim())}`);
      setOpen(false);
    }
  };
  return (
    <div ref={ref} className="search-box">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
      >
        <SearchIcon size={19} aria-hidden="true" />
        <label htmlFor="global-search" className="sr-only">
          Buscar productos
        </label>
        <input
          id="global-search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && q.length >= 2}
          aria-controls="search-results"
          aria-activedescendant={
            active >= 0 && products[active] ? `suggestion-${active}` : undefined
          }
          autoComplete="off"
          placeholder="¿Qué necesitas para tu próximo proyecto?"
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => Math.min(index + 1, products.length - 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, -1));
            }
            if (event.key === "Enter" && active >= 0 && products[active]) {
              event.preventDefault();
              navigate(`/producto/${products[active].slug}`);
              setOpen(false);
            }
          }}
        />
        <button type="submit" aria-label="Buscar">
          <ArrowUpRight size={19} />
        </button>
      </form>
      {open && q.length >= 2 && (
        <div className="search-results">
          <ul
            role="listbox"
            id="search-results"
            aria-label="Sugerencias de productos"
          >
            {query.isPending && (
              <li className="p-4 text-sm text-muted">Buscando…</li>
            )}
            {query.isError && (
              <li className="p-4 text-sm text-muted">
                Las sugerencias no están disponibles.
              </li>
            )}
            {!query.isPending && !query.isError && !products.length && (
              <li className="p-4 text-sm text-muted">
                No encontramos coincidencias.
              </li>
            )}
            {products.map((product, index) => (
              <li
                key={product.id}
                id={`suggestion-${index}`}
                role="option"
                aria-selected={active === index}
              >
                <Link
                  to={`/producto/${product.slug}`}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setActive(index)}
                  className={active === index ? "bg-canvas" : ""}
                >
                  <ProductImage src={product.images[0]} alt="" />
                  <span>
                    {product.name}
                    <strong>{money(product.price)}</strong>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <button
            className="text-link w-full border-t p-4"
            type="button"
            onClick={search}
          >
            Ver todos los resultados <ArrowUpRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
