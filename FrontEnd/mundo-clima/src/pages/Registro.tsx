import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useRegistro, type RegistroBody } from '../api/cuenta'
import { AlertaError } from '../components/ui/basicos'
import { Campo } from '../components/ui/Campo'
import { Icon } from '../components/ui/Icon'
import { mensajeError } from '../lib/api'

type Tipo = RegistroBody['rol']
const TIPOS: [Tipo, string, string, string][] = [
  ['CLIENTE_FINAL', 'Hogar o negocio', 'Compra a precio público', 'house'],
  ['TECNICO', 'Técnico', 'Precio Técnico en todo el catálogo', 'hard-hat'],
  ['DISTRIBUIDOR', 'Distribuidor', 'Precio Distribuidor para compras de volumen', 'building-2'],
]
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Form {
  nombre: string
  email: string
  password: string
  telefono: string
  documento: string
  empresa: string
}
type Errores = Partial<Record<keyof Form, string>>

export default function Registro() {
  const [sp] = useSearchParams()
  const redirect = sp.get('redirect')
  const inicial = sp.get('tipo') as Tipo | null
  const [tipo, setTipo] = useState<Tipo>(inicial && TIPOS.some((t) => t[0] === inicial) ? inicial : 'CLIENTE_FINAL')
  const [f, setF] = useState<Form>({ nombre: '', email: '', password: '', telefono: '', documento: '', empresa: '' })
  const [err, setErr] = useState<Errores>({})
  const [verPw, setVerPw] = useState(false)
  const [terminos, setTerminos] = useState(false)
  const [terminosErr, setTerminosErr] = useState(false)
  const registro = useRegistro()

  const campo = (k: keyof Form) => ({
    name: k,
    value: f[k],
    error: err[k],
    onChange: (e: { target: { value: string } }) => {
      const v = e.target.value
      setF((x) => ({ ...x, [k]: v }))
      setErr((x) => ({ ...x, [k]: undefined }))
    },
  })

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const x: Errores = {}
    if (f.nombre.trim().length < 3) x.nombre = 'Escribe tu nombre completo'
    if (!EMAIL.test(f.email.trim())) x.email = 'Escribe un correo válido'
    if (f.password.length < 8) x.password = 'Usa al menos 8 caracteres'
    if (f.telefono && !/^\+?[\d\s]{7,15}$/.test(f.telefono.trim())) x.telefono = 'Escribe un teléfono válido'
    if (tipo !== 'CLIENTE_FINAL' && !f.documento.trim()) x.documento = 'Necesario para cuentas profesionales'
    if (tipo === 'DISTRIBUIDOR' && !f.empresa.trim()) x.empresa = 'Escribe la razón social'
    setErr(x)
    setTerminosErr(!terminos)
    if (Object.keys(x).length || !terminos) return
    registro.mutate(
      {
        nombre_completo: f.nombre.trim(),
        email: f.email.trim().toLowerCase(),
        password: f.password,
        rol: tipo,
        telefono: f.telefono.trim() || undefined,
        documento_identidad: f.documento.trim() || undefined,
        nombre_empresa: tipo !== 'CLIENTE_FINAL' ? f.empresa.trim() || undefined : undefined,
      },
    )
    // Al guardar la sesión, SoloInvitado (App.tsx) redirige a ?redirect=.
  }

  return (
    <div className="mx-auto max-w-[780px] px-[clamp(16px,4vw,32px)] pt-[clamp(24px,5vw,56px)]">
      <form onSubmit={enviar} noValidate className="flex flex-col gap-[18px] rounded-lg border border-line bg-white p-[clamp(22px,4vw,36px)]">
        <div>
          <h1 className="m-0 font-display text-[clamp(24px,3vw,30px)] font-bold text-ink">Crea tu cuenta</h1>
          <p className="mt-1.5 mb-0 text-muted">Compra para tu hogar o negocio, o accede a precios de nivel como profesional.</p>
        </div>
        <div role="radiogroup" aria-label="Tipo de cuenta" className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,190px),1fr))] gap-2.5">
          {TIPOS.map(([k, label, desc, icono]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={tipo === k}
              onClick={() => { setTipo(k); setErr({}) }}
              className={`flex flex-col gap-1.5 rounded-md border-2 p-3.5 text-left ${tipo === k ? 'border-primary bg-select' : 'border-line bg-white'}`}
            >
              <span className="flex text-primary">
                <Icon name={icono} size={22} />
              </span>
              <strong className="text-[15px]">{label}</strong>
              <span className="text-[13px] leading-[1.4] text-muted">{desc}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3.5">
          <Campo label="Nombre completo" completo autoComplete="name" placeholder="Como aparece en tu documento" {...campo('nombre')} />
          <Campo label="Correo electrónico" type="email" autoComplete="email" placeholder="tu@correo.com" {...campo('email')} />
          <Campo
            label="Contraseña"
            type={verPw ? 'text' : 'password'}
            autoComplete="new-password"
            hint="Mínimo 8 caracteres"
            {...campo('password')}
          />
          <Campo label="Celular" type="tel" inputMode="tel" autoComplete="tel" opcional placeholder="300 123 4567" {...campo('telefono')} />
          <Campo
            label={tipo === 'DISTRIBUIDOR' ? 'NIT' : 'Cédula o NIT'}
            opcional={tipo === 'CLIENTE_FINAL'}
            placeholder={tipo === 'DISTRIBUIDOR' ? '900123456-1' : '1020304050'}
            {...campo('documento')}
          />
          {tipo !== 'CLIENTE_FINAL' && (
            <Campo
              label={tipo === 'DISTRIBUIDOR' ? 'Razón social' : 'Empresa o taller'}
              opcional={tipo === 'TECNICO'}
              completo
              autoComplete="organization"
              {...campo('empresa')}
            />
          )}
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input type="checkbox" checked={verPw} onChange={() => setVerPw((v) => !v)} className="m-0 size-[18px] accent-primary" />
          Mostrar contraseña
        </label>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-[1.45]">
          <input
            type="checkbox"
            checked={terminos}
            onChange={() => { setTerminos((v) => !v); setTerminosErr(false) }}
            className="m-0 mt-0.5 size-[18px] accent-primary"
          />
          Acepto los términos y condiciones y la política de tratamiento de datos personales.
        </label>
        {terminosErr && (
          <span role="alert" className="-mt-2.5 text-[13px] text-err">
            Debes aceptar los términos para crear tu cuenta.
          </span>
        )}
        {registro.isError && <AlertaError>{mensajeError(registro.error)}</AlertaError>}
        <button
          type="submit"
          disabled={registro.isPending}
          className="h-[52px] rounded-md bg-primary font-display text-base font-bold tracking-[0.04em] text-white uppercase hover:bg-primary-dark disabled:opacity-70"
        >
          {registro.isPending ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
        <span className="flex justify-center gap-1.5 text-sm">
          ¿Ya tienes cuenta?
          <Link to={`/ingresar${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-bold text-primary-dark">
            Ingresa
          </Link>
        </span>
      </form>
    </div>
  )
}
