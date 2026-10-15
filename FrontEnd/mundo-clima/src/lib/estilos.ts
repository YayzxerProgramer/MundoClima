/** Clases de botón repetidas en todo el diseño. */
export const btn = {
  base: 'inline-flex items-center justify-center gap-2 rounded-md font-display font-bold uppercase tracking-[0.04em] disabled:cursor-not-allowed disabled:opacity-50',
  accent: 'bg-accent text-accent-ink hover:bg-accent-dark',
  primary: 'bg-primary text-white hover:bg-primary-dark',
  outline: 'border-[1.5px] border-primary bg-white text-primary hover:bg-tint',
  ghost: 'border border-line-strong bg-white font-sans font-bold text-primary hover:border-primary-dark',
}

/** Input de formulario (altura 48, foco azul). */
export const input =
  'h-12 rounded-md border bg-white px-3.5 text-[15px] font-normal text-ink outline-none focus:border-primary-dark focus:shadow-[0_0_0_3px_rgba(40,168,224,0.4)]'

export const tarjeta = 'rounded-lg border border-line bg-white'
