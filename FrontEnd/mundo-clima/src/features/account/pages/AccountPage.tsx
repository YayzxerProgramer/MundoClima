import { Link } from "react-router";
import {
  Package,
  UserRound,
  LogOut,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useSession } from "../../auth/hooks/session";
import { logout } from "../../auth/api/auth";
import { roleLabel } from "../../auth/types";
import { Badge, Breadcrumbs, Button } from "../../../shared/ui";
import { SEO } from "../../../shared/ui/SEO";
export default function AccountPage() {
  const user = useSession((state) => state.user)!;
  return (
    <div className="container-site pb-10">
      <SEO title="Mi cuenta" noIndex />
      <Breadcrumbs items={[{ label: "Mi cuenta" }]} />
      <div className="page-heading">
        <div>
          <p className="eyebrow">TU ESPACIO EN MUNDO CLIMA</p>
          <h1>Hola, {user.name.split(" ")[0]}.</h1>
          <p>
            Consulta tus datos y encuentra toda la información de tus compras.
          </p>
        </div>
        <Button variant="outline" onClick={logout}>
          <LogOut size={16} /> Cerrar sesión
        </Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="card p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="empty-symbol">
              <UserRound size={23} />
            </span>
            <div>
              <h2 className="text-lg">Mi perfil</h2>
              <Badge tone="blue">{roleLabel[user.role]}</Badge>
            </div>
          </div>
          <dl className="profile-details">
            {[
              ["Nombre completo", user.name],
              ["Correo electrónico", user.email],
              ["Teléfono", user.phone],
              ["Documento", user.document],
              ["Empresa", user.company],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value || "Sin registrar"}</dd>
              </div>
            ))}
          </dl>
        </section>
        <div className="grid content-start gap-5">
          <Link to="/cuenta/pedidos" className="account-card">
            <Package size={28} />
            <div>
              <h2>Mis pedidos</h2>
              <p>Consulta compras, pagos y seguimiento.</p>
            </div>
            <ArrowRight size={19} />
          </Link>
          {user.role === "ADMIN" && (
            <Link to="/admin" className="account-card">
              <ShieldCheck size={28} />
              <div>
                <h2>Administración</h2>
                <p>Gestiona tu tienda y sus resultados.</p>
              </div>
              <ArrowRight size={19} />
            </Link>
          )}
          <div className="rounded-card bg-primary/5 p-6">
            <h3 className="text-sm">Tu precio, según tu cuenta</h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              {user.role === "TECNICO" || user.role === "DISTRIBUIDOR"
                ? "Los productos muestran el precio disponible para tu nivel profesional. Consulta las condiciones de volumen en cada ficha."
                : "Encuentra equipos y suministros para tu hogar o negocio, con precios claros y disponibilidad actualizada."}
            </p>
            <Link to="/productos" className="text-link mt-4">
              Explorar catálogo <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
