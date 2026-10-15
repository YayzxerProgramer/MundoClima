import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  X,
} from "lucide-react";
import {
  cx,
  money,
  PRODUCT_PLACEHOLDER,
  safeImage,
  SHOW_PRODUCT_PHOTOS,
} from "../lib/format";
import { errorMessage } from "../lib/api";
import { useUI } from "../hooks/ui-store";
import type { Product } from "../../features/catalog/types";
const buttonClasses = { primary: "btn-primary", buy: "btn-buy", outline: "btn-outline", ghost: "btn-ghost", danger: "btn-danger" };
const badgeClasses = { default: "badge-default", success: "badge-success", warning: "badge-warning", danger: "badge-danger", blue: "badge-blue" };
export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "buy" | "outline" | "ghost" | "danger";
    loading?: boolean;
  }
>(function Button(
  {
    className,
    variant = "primary",
    loading,
    children,
    disabled,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx("btn", buttonClasses[variant], className)}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
});
export function LinkButton({
  to,
  children,
  variant = "primary",
  className,
}: {
  to: string;
  children: ReactNode;
  variant?: "primary" | "buy" | "outline" | "ghost";
  className?: string;
}) {
  return (
    <Link to={to} className={cx("btn", buttonClasses[variant], className)}>
      {children}
    </Link>
  );
}
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input {...props} ref={ref} className={cx("input", className)} />;
});
export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return <select {...props} ref={ref} className={cx("input", className)} />;
});
export function Field({
  label,
  error,
  children,
  id,
  hint,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  id: string;
  hint?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
export const Checkbox = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }
>(function Checkbox({ label, className, ...props }, ref) {
  return (
    <label className={cx("checkbox-label", className)}>
      <input {...props} ref={ref} type="checkbox" className="checkbox" />
      <span>{label}</span>
    </label>
  );
});
export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "blue";
}) {
  return <span className={cx("badge", badgeClasses[tone])}>{children}</span>;
}
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx("card", className)}>{children}</div>;
}
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx("skeleton", className)} />;
}
export function ProductSkeletons({ count = 4 }: { count?: number }) {
  return (
    <div className="product-grid" role="status" aria-label="Cargando productos">
      {Array.from({ length: count }, (_, index) => (
        <div className="card p-5" key={index}>
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="mt-5 h-3 w-1/3" />
          <Skeleton className="mt-3 h-5 w-full" />
          <Skeleton className="mt-6 h-7 w-1/2" />
        </div>
      ))}
    </div>
  );
}
export function ErrorState({
  error,
  retry,
  compact = false,
}: {
  error: unknown;
  retry?: () => void;
  compact?: boolean;
}) {
  return (
    <div role="alert" className={cx("state-box", compact && "state-compact")}>
      <AlertCircle size={28} className="text-primary" />
      <h3>No pudimos cargar esta información</h3>
      <p>{errorMessage(error)}</p>
      {retry && (
        <Button variant="outline" onClick={retry}>
          Volver a intentar
        </Button>
      )}
    </div>
  );
}
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="state-box">
      <span className="empty-symbol">
        <ArrowRight size={24} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  );
}
let scrollLocks = 0;
function DialogFrame({
  open,
  onClose,
  title,
  children,
  drawer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  drawer?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const focused = document.activeElement;
    dialog.showModal();
    scrollLocks++;
    document.body.classList.add("dialog-open");
    return () => {
      dialog.close();
      scrollLocks--;
      if (!scrollLocks) document.body.classList.remove("dialog-open");
      if (focused instanceof HTMLElement) focused.focus();
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={drawer ? "drawer" : "modal"}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const b = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < b.left ||
            event.clientX > b.right ||
            event.clientY < b.top ||
            event.clientY > b.bottom
          )
            onClose();
        }
      }}
    >
      <div className="dialog-head">
        <h2 id={titleId}>{title}</h2>
        <Button
          variant="ghost"
          className="icon-btn"
          aria-label="Cerrar"
          onClick={onClose}
        >
          <X size={21} />
        </Button>
      </div>
      <div className="dialog-content">{open && children}</div>
    </dialog>
  );
}
export const Drawer = (props: Parameters<typeof DialogFrame>[0]) => (
  <DialogFrame {...props} drawer />
);
export const Modal = (props: Parameters<typeof DialogFrame>[0]) => (
  <DialogFrame {...props} />
);
export function Toasts() {
  const { toasts, dismiss } = useUI();
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div
          className={cx("toast", toast.tone === "error" && "toast-error")}
          key={toast.id}
          role="status"
        >
          {toast.tone === "success" ? (
            <Check size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <p>{toast.message}</p>
          <button aria-label="Cerrar aviso" onClick={() => dismiss(toast.id)}>
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  if (pages <= 1) return null;
  const visible = [
    ...new Set([
      1,
      ...Array.from({ length: 5 }, (_, i) => page + i - 2).filter(
        (v) => v > 1 && v < pages,
      ),
      pages,
    ]),
  ];
  return (
    <nav className="pagination" aria-label="Paginación">
      <Button
        variant="outline"
        className="icon-btn"
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={18} />
      </Button>
      {visible.map((value, i) => (
        <span className="contents" key={value}>
          {i > 0 && value - visible[i - 1] > 1 && (
            <span aria-hidden="true">…</span>
          )}
          <Button
            variant={value === page ? "primary" : "ghost"}
            className="icon-btn"
            aria-current={value === page ? "page" : undefined}
            onClick={() => onChange(value)}
          >
            {value}
          </Button>
        </span>
      ))}
      <Button
        variant="outline"
        className="icon-btn"
        aria-label="Página siguiente"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight size={18} />
      </Button>
    </nav>
  );
}
export function Breadcrumbs({
  items,
}: {
  items: { label: string; to?: string }[];
}) {
  return (
    <nav aria-label="Ruta de navegación" className="breadcrumbs">
      <Link to="/">Inicio</Link>
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`}>
          <ChevronRight size={12} aria-hidden="true" />
          {item.to ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
export function PriceTag({
  product,
  large = false,
}: {
  product: Product;
  large?: boolean;
}) {
  return (
    <div className={cx("price-tag", large && "price-large")}>
      {product.discount && (
        <div className="mb-2">
          <Badge tone="blue">
            {product.appliedLevel === "DISTRIBUIDOR"
              ? "Precio Distribuidor"
              : "Precio Técnico"}
          </Badge>
        </div>
      )}
      <div className="price-row">
        <strong>{money(product.price)}</strong>
        {product.discount && <del>{money(product.basePrice)}</del>}
      </div>
      {product.discount && (
        <p className="text-xs text-success">
          Ahorras {money(product.saving)} ({product.savingPercent}%)
        </p>
      )}
    </div>
  );
}
export function QuantityStepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div className="quantity">
      <button
        type="button"
        disabled={value <= 1 || max < 1}
        onClick={() => onChange(value - 1)}
        aria-label="Reducir cantidad"
      >
        <Minus size={15} />
      </button>
      <label className="sr-only" htmlFor={id}>
        Cantidad
      </label>
      <input
        id={id}
        type="number"
        min="1"
        max={Math.max(1, max)}
        value={value}
        inputMode="numeric"
        disabled={max < 1}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n))
            onChange(Math.max(1, Math.min(max, Math.floor(n))));
        }}
      />
      <button
        type="button"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        aria-label="Aumentar cantidad"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
export function ProductImage({
  src,
  alt,
  className,
  eager = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  return (
    <img
      src={
        src && SHOW_PRODUCT_PHOTOS ? safeImage(src) : PRODUCT_PLACEHOLDER
      }
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      className={className}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = PRODUCT_PLACEHOLDER;
      }}
    />
  );
}
export function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="accordion" open={defaultOpen || undefined}>
      <summary>
        {title}
        <Plus size={15} aria-hidden="true" />
      </summary>
      <div>{children}</div>
    </details>
  );
}
export function Tabs({
  items,
}: {
  items: { id: string; label: string; content: ReactNode }[];
}) {
  const [active, setActive] = useState(items[0]?.id),
    uid = useId();
  return (
    <div>
      <div className="tabs" role="tablist">
        {items.map((item, index) => (
          <button
            id={`${uid}-${item.id}`}
            aria-controls={`${uid}-${item.id}-panel`}
            type="button"
            key={item.id}
            role="tab"
            tabIndex={active === item.id ? 0 : -1}
            aria-selected={active === item.id}
            onClick={() => setActive(item.id)}
            onKeyDown={(e) => {
              let next: number;
              if (e.key === "ArrowRight") next = (index + 1) % items.length;
              else if (e.key === "ArrowLeft")
                next = (index + items.length - 1) % items.length;
              else if (e.key === "Home") next = 0;
              else if (e.key === "End") next = items.length - 1;
              else return;
              e.preventDefault();
              setActive(items[next].id);
              document.getElementById(`${uid}-${items[next].id}`)?.focus();
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          id={`${uid}-${item.id}-panel`}
          role="tabpanel"
          aria-labelledby={`${uid}-${item.id}`}
          hidden={active !== item.id}
          tabIndex={0}
          className="tab-panel"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
export function RangeSlider({
  min,
  max,
  from,
  to,
  onApply,
}: {
  min: number;
  max: number;
  from: number;
  to: number;
  onApply: (from: number, to: number) => void;
}) {
  const lower = Math.max(1, min),
    upper = Math.max(lower + 1, max),
    [values, setValues] = useState([Math.max(min, from), Math.min(max, to)]),
    uid = useId();
  const toScale = (v: number) =>
    Math.round(
      ((Math.log(Math.max(lower, v)) - Math.log(lower)) /
        (Math.log(upper) - Math.log(lower))) *
        1000,
    );
  const fromScale = (v: number) =>
    Math.round(
      Math.exp(
        Math.log(lower) + (v / 1000) * (Math.log(upper) - Math.log(lower)),
      ),
    );
  return (
    <div className="range-filter">
      <div className="range-inputs">
        <Field label="Desde" id={`${uid}-min`}>
          <Input
            id={`${uid}-min`}
            inputMode="numeric"
            value={money(values[0])}
            onChange={(e) =>
              setValues([
                Number(e.target.value.replace(/\D/g, "")) || 0,
                values[1],
              ])
            }
          />
        </Field>
        <Field label="Hasta" id={`${uid}-max`}>
          <Input
            id={`${uid}-max`}
            inputMode="numeric"
            value={money(values[1])}
            onChange={(e) =>
              setValues([
                values[0],
                Number(e.target.value.replace(/\D/g, "")) || 0,
              ])
            }
          />
        </Field>
      </div>
      <label className="sr-only" htmlFor={`${uid}-range-min`}>
        Precio mínimo, escala logarítmica
      </label>
      <input
        id={`${uid}-range-min`}
        type="range"
        min="0"
        max="1000"
        value={toScale(values[0])}
        aria-valuetext={money(values[0])}
        onChange={(e) =>
          setValues([
            Math.min(values[1], fromScale(Number(e.target.value))),
            values[1],
          ])
        }
      />
      <label className="sr-only" htmlFor={`${uid}-range-max`}>
        Precio máximo, escala logarítmica
      </label>
      <input
        id={`${uid}-range-max`}
        type="range"
        min="0"
        max="1000"
        value={toScale(values[1])}
        aria-valuetext={money(values[1])}
        onChange={(e) =>
          setValues([
            values[0],
            Math.max(values[0], fromScale(Number(e.target.value))),
          ])
        }
      />
      <Button
        variant="outline"
        className="w-full btn-sm"
        disabled={values[0] > values[1]}
        onClick={() =>
          onApply(
            Math.max(min, Math.min(max, values[0])),
            Math.min(max, Math.max(min, values[1])),
          )
        }
      >
        Aplicar precio
      </Button>
    </div>
  );
}
