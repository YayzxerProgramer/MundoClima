import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  Package,
  ShoppingBag,
  Users,
  ArrowUpRight,
} from "lucide-react";
export function AdminLayout() {
  return (
    <div className="container-site admin-layout">
      <aside className="admin-nav">
        <p className="eyebrow">ADMINISTRACIÓN</p>
        <nav aria-label="Administración">
          <NavLink to="/admin" end>
            <BarChart3 size={18} /> Resumen
          </NavLink>
          <NavLink to="/admin/pedidos">
            <ShoppingBag size={18} /> Pedidos
          </NavLink>
          <NavLink to="/admin/productos">
            <Package size={18} /> Productos
          </NavLink>
          <NavLink to="/admin/usuarios">
            <Users size={18} /> Usuarios
          </NavLink>
          <NavLink to="/productos">
            <ArrowUpRight size={18} /> Ver tienda
          </NavLink>
        </nav>
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
