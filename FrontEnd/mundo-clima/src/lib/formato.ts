const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const entero = new Intl.NumberFormat('es-CO')
const fechaHora = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' })

/** $1.950.000 (sin el espacio duro que agrega Intl). */
export const fmt = (n: number | string) => cop.format(Number(n)).replace(/\s/g, '')
export const fmtN = (n: number | string) => entero.format(Number(n))
export const fmtFecha = (d: string | Date) => fechaHora.format(new Date(d))

/** Minúsculas sin tildes, para comparar textos. */
export const normalizar = (s: string | null | undefined) =>
  (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

export const primerNombre = (nombre: string | null | undefined) => (nombre ?? '').trim().split(/\s+/)[0] ?? ''
