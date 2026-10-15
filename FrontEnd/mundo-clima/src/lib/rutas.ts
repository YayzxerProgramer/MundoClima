/** Solo rutas internas: evita redirigir a otro dominio con ?redirect=. */
export const destinoSeguro = (r: string | null | undefined) => (r && r.startsWith('/') && !r.startsWith('//') ? r : '/')
