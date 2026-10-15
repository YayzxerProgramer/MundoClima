import { EmptyState, LinkButton } from "../../../shared/ui";
import { SEO } from "../../../shared/ui/SEO";
export default function NotFoundPage() {
  return (
    <div className="container-site page-section">
      <SEO title="Página no encontrada" noIndex />
      <EmptyState
        title="Parece que nos salimos de ruta"
        description="La página que buscas no existe o cambió de dirección."
      >
        <p className="font-display text-7xl font-bold text-primary/25">404</p>
        <LinkButton to="/">Volver al inicio</LinkButton>
      </EmptyState>
    </div>
  );
}
