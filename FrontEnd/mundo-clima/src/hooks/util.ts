import { useEffect, useState } from 'react'

export function useMediaQuery(query: string) {
  const [coincide, setCoincide] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const fn = () => setCoincide(mq.matches)
    fn()
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [query])
  return coincide
}

/** Breakpoints del diseño: escritorio ≥1024, móvil <768. */
export const useEsEscritorio = () => useMediaQuery('(min-width: 1024px)')

export function useDebounce<T>(valor: T, ms = 250) {
  const [v, setV] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setV(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return v
}

/** Desplaza a la sección de cuentas profesionales del inicio. */
export function irASeccionB2B() {
  setTimeout(() => {
    const el = document.getElementById('mc-b2b')
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 150, behavior: 'smooth' })
  }, 60)
}
