import { Breadcrumbs } from "../../../shared/ui";
import { SEO } from "../../../shared/ui/SEO";
import { CartContents } from "../components/CartContents";
export default function CartPage() {
  return (
    <div className="container-site pb-10">
      <SEO title="Mi carrito" noIndex />
      <Breadcrumbs items={[{ label: "Mi carrito" }]} />
      <div className="page-heading">
        <div>
          <p className="eyebrow">TU PRÓXIMO PROYECTO</p>
          <h1>Mi carrito</h1>
          <p>Todo lo que necesitas, un paso más cerca.</p>
        </div>
      </div>
      <CartContents />
    </div>
  );
}
