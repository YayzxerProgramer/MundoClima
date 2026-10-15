import { Link } from "react-router-dom";
import { ArrowUpRight, CreditCard, LockKeyhole, MapPin } from "lucide-react";
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container-site footer-grid">
        <div>
          <Link
            to="/"
            className="footer-brand"
            aria-label="Mundo Clima, inicio"
          >
            <img src="/brand/symbol-white.png" alt="" />
            <img src="/brand/wordmark-white.png" alt="Mundo Clima" />
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-7 text-white/70">
            Clima que impulsa tu mundo.
            <br />
            Soluciones para vivir mejor y llevar tus proyectos más lejos.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-xs text-white/70">
            <MapPin size={15} /> Colombia
          </span>
        </div>
        <div>
          <h3>Encuentra tu solución</h3>
          <Link to="/categoria/aires-acondicionados">Aires acondicionados</Link>
          <Link to="/categoria/compresores">Compresores</Link>
          <Link to="/categoria/gases-refrigerantes">Gases refrigerantes</Link>
          <Link to="/categoria/herramientas">Herramientas</Link>
          <Link to="/productos">
            Todo el catálogo <ArrowUpRight size={13} />
          </Link>
        </div>
        <div>
          <h3>Estamos para ayudarte</h3>
          <Link to="/ayuda">Preguntas frecuentes</Link>
          <Link to="/cuenta/pedidos">Mis pedidos</Link>
          <Link to="/rastreo">Rastrea tu envío</Link>
          <Link to="/login">Mi cuenta</Link>
        </div>
        <div>
          <h3>Tu negocio, a otro nivel</h3>
          <p className="mb-4 text-sm leading-6 text-white/70">
            Accede a precios para técnicos y distribuidores con tu cuenta
            profesional.
          </p>
          <Link to="/registro" className="footer-register">
            Crear mi cuenta <ArrowRightIcon />
          </Link>
          <div className="mt-6 flex items-center gap-2 text-xs text-white/70">
            <LockKeyhole size={16} /> Pago en línea con Wompi
          </div>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <CreditCard size={21} />
            <span>Tarjetas · PSE · Nequi</span>
          </div>
        </div>
      </div>
      <div className="container-site footer-bottom">
        <p>
          ©{" "}
          {new Intl.DateTimeFormat("es-CO", {
            year: "numeric",
            timeZone: "America/Bogota",
          }).format(new Date())}{" "}
          Mundo Clima. Todos los derechos reservados.
        </p>
        <span>Equipos · Repuestos · Insumos</span>
      </div>
    </footer>
  );
}
function ArrowRightIcon() {
  return <ArrowUpRight size={16} />;
}
