export const money = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
export const number = (value: number) =>
  new Intl.NumberFormat("es-CO").format(value);
export const date = (value: string) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeZone: "America/Bogota",
  }).format(new Date(value));
export const cx = (...values: (string | false | null | undefined)[]) =>
  values.filter(Boolean).join(" ");
export const safeReturnPath = (path: string | null) =>
  path?.startsWith("/") &&
  !path.startsWith("//") &&
  !path.includes("\\") &&
  !/^\/(login|registro)(\?|$)/.test(path)
    ? path
    : "/cuenta";
export const PRODUCT_PLACEHOLDER = "/images/product-placeholder.svg";
// Las fotos de la semilla del backend son genéricas: hasta tener fotos reales
// se muestra el marcador de la tienda (VITE_FOTOS_BACKEND=true las activa).
export const SHOW_PRODUCT_PHOTOS = import.meta.env.VITE_FOTOS_BACKEND === "true";
export const safeImage = (url: string) =>
  /^(https?:\/\/|\/(?!\/))/.test(url) ? url : PRODUCT_PLACEHOLDER;
