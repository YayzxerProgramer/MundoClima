import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useLogin } from '../api/cuenta'
import { AlertaError } from '../components/ui/basicos'
import { Campo } from '../components/ui/Campo'
import { Icon } from '../components/ui/Icon'
import { estadoHttp, mensajeError } from '../lib/api'
import { ROL_LABEL, USUARIOS_DEMO } from '../lib/constantes'
import { useUI } from '../store/ui'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Ingresar() {
  const [sp] = useSearchParams()
  const redirect = sp.get('redirect')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPw, setVerPw] = useState(false)
  const [errores, setErrores] = useState<{ email?: string; password?: string }>({})
  const login = useLogin()

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const err: typeof errores = {}
    if (!EMAIL.test(email.trim())) err.email = 'Escribe un correo válido'
    if (!password) err.password = 'Escribe tu contraseña'
    setErrores(err)
    if (Object.keys(err).length) return
    // Al guardar la sesión, SoloInvitado (App.tsx) redirige a ?redirect=.
    login.mutate({ email: email.trim().toLowerCase(), password })
  }

  const credencialesMalas = login.isError && estadoHttp(login.error) === 401
  const msgRedirect = redirect?.startsWith('/checkout')
    ? 'Inicia sesión para continuar con tu pago. Tu carrito se conserva.'
    : 'Inicia sesión para ver tu cuenta y tus pedidos.'

  return (
    <div className="mx-auto grid max-w-[1080px] grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-start gap-7 px-[clamp(16px,4vw,32px)] pt-[clamp(24px,5vw,56px)]">
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4 rounded-lg border border-line bg-white p-[clamp(22px,4vw,36px)]">
        <h1 className="m-0 font-display text-[clamp(24px,3vw,30px)] font-bold text-ink">Ingresa a tu cuenta</h1>
        {redirect && redirect !== '/' && (
          <div className="flex gap-2.5 rounded-md bg-tint-2 px-3.5 py-3 text-sm leading-[1.45] text-primary">
            <span className="flex">
              <Icon name="lock" size={18} />
            </span>
            {msgRedirect}
          </div>
        )}
        <div className="grid gap-3.5">
          <Campo
            label="Correo electrónico"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            value={email}
            error={errores.email}
            onChange={(e) => { setEmail(e.target.value); setErrores((x) => ({ ...x, email: undefined })); login.reset() }}
          />
          <Campo
            label="Contraseña"
            type={verPw ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            value={password}
            error={errores.password}
            onChange={(e) => { setPassword(e.target.value); setErrores((x) => ({ ...x, password: undefined })); login.reset() }}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input type="checkbox" checked={verPw} onChange={() => setVerPw((v) => !v)} className="m-0 size-[18px] accent-primary" />
          Mostrar contraseña
        </label>
        {credencialesMalas && <AlertaError>Correo o contraseña incorrectos. Revisa tus datos.</AlertaError>}
        {login.isError && !credencialesMalas && <AlertaError>{mensajeError(login.error)}</AlertaError>}
        <button
          type="submit"
          disabled={login.isPending}
          className="flex h-[52px] items-center justify-center gap-2.5 rounded-md bg-primary font-display text-base font-bold tracking-[0.04em] text-white uppercase hover:bg-primary-dark disabled:opacity-70"
        >
          {login.isPending ? 'Ingresando…' : 'Ingresar'}
        </button>
        <div className="flex flex-wrap justify-between gap-2.5 text-sm">
          <button
            type="button"
            onClick={() => useUI.getState().avisar('Recuperar contraseña llega en la Fase 2')}
            className="text-sm font-semibold text-primary-dark"
          >
            ¿Olvidaste tu contraseña?
          </button>
          <span className="flex gap-1.5">
            ¿No tienes cuenta?
            <Link to={`/registro${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-bold text-primary-dark">
              Regístrate
            </Link>
          </span>
        </div>
      </form>
      <aside className="flex flex-col gap-4">
        <div className="flex flex-col gap-2.5 rounded-lg bg-primary p-[clamp(22px,3vw,30px)] text-white">
          <span className="flex text-sky">
            <Icon name="briefcase-business" size={24} />
          </span>
          <h2 className="m-0 font-display text-xl font-bold">¿Técnico o distribuidor?</h2>
          <p className="m-0 leading-normal text-[#C9D6E2]">
            Al ingresar con tu cuenta profesional, el catálogo, la ficha de producto y el carrito muestran tu precio de nivel.
          </p>
        </div>
        {import.meta.env.DEV && (
          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-line-strong bg-white p-[18px]">
            <span className="font-mono text-xs text-muted">Cuentas de prueba (semilla) · clic para llenar</span>
            {USUARIOS_DEMO.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => { setEmail(u.email); setPassword(u.password); setErrores({}); login.reset() }}
                className="flex items-center justify-between gap-2.5 rounded-md border border-line bg-white px-3 py-2.5 text-left text-sm hover:border-primary-dark"
              >
                <span className="min-w-0 truncate">{u.email}</span>
                <span className="rounded-md bg-line-2 px-2 py-0.5 text-xs font-bold whitespace-nowrap">{ROL_LABEL[u.rol]}</span>
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  )
}
