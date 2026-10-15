import { isRouteErrorResponse, useRouteError } from "react-router-dom";
export default function ErrorPage() {
  const error = useRouteError();
  return (
    <main className="container-site page-section">
      <div className="state-box">
        <img
          src="/brand/wordmark.png"
          alt="Mundo Clima"
          className="mb-5 w-52"
        />
        <h1>
          {isRouteErrorResponse(error) && error.status === 404
            ? "No encontramos esta página"
            : "Algo no salió como esperábamos"}
        </h1>
        <p>
          Puedes volver a la tienda o recargar esta página para intentarlo de
          nuevo.
        </p>
        <a href="/" className="btn btn-primary">
          Volver al inicio
        </a>
        <button
          className="btn btn-outline"
          onClick={() => window.location.reload()}
        >
          Recargar página
        </button>
      </div>
    </main>
  );
}
