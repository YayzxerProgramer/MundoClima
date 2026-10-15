import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router";
export function SEO({
  title,
  description = "Aires acondicionados, repuestos e insumos de refrigeración. Encuentra la solución para tu hogar, negocio o próximo proyecto en Mundo Clima.",
  jsonLd,
  noIndex = false,
}: {
  title: string;
  description?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noIndex?: boolean;
}) {
  const { pathname } = useLocation();
  return (
    <Helmet>
      <title>{title} | Mundo Clima</title>
      <meta name="description" content={description} />
      <meta name="theme-color" content="#0A598A" />
      <link rel="canonical" href={`${window.location.origin}${pathname}`} />
      <meta property="og:title" content={`${title} | Mundo Clima`} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta
        name="robots"
        content={noIndex ? "noindex,nofollow" : "index,follow"}
      />
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd).replace(/</g, "\\u003c")}
        </script>
      )}
    </Helmet>
  );
}
