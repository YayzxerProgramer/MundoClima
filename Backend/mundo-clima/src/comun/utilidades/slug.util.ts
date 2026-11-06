/**
 * Función utilitaria para generar slugs URL-friendly a partir de un texto en español
 */
export function generarSlug(texto: string): string {
  if (!texto) return '';

  return texto
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina acentos y tildes
    .replace(/[^a-z0-9]+/g, '-')     // Reemplaza caracteres no alfanuméricos por guiones
    .replace(/(^-|-$)+/g, '');       // Remueve guiones al inicio y al final
}
