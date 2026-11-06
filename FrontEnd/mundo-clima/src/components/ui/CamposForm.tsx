import type { InputHTMLAttributes, ReactNode, Ref, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { input } from '../../lib/estilos'
import { Icon } from './Icon'

// Mismos campos que Campo, para select, textarea y casillas de verificación.

function MensajeError({ error }: { error?: string }) {
  if (!error) return null
  return (
    <span role="alert" className="flex items-center gap-1.5 text-[13px] font-medium text-err">
      <Icon name="circle-alert" size={14} />
      {error}
    </span>
  )
}

interface Base {
  label: string
  error?: string
  hint?: string
  opcional?: boolean
  completo?: boolean
}

function Etiqueta({ label, opcional }: { label: string; opcional?: boolean }) {
  return (
    <span>
      {label}
      {opcional && <span className="font-normal text-muted-2"> · opcional</span>}
    </span>
  )
}

export function CampoSelect({
  label,
  error,
  hint,
  opcional,
  completo,
  ref,
  children,
  ...rest
}: Base & SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement>; children: ReactNode }) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm font-semibold ${completo ? 'col-span-full' : ''}`}>
      <Etiqueta label={label} opcional={opcional} />
      <select {...rest} ref={ref} aria-invalid={!!error} className={`${input} ${error ? 'border-err' : 'border-line-strong'}`}>
        {children}
      </select>
      {error ? <MensajeError error={error} /> : hint && <span className="text-[13px] font-normal text-muted-2">{hint}</span>}
    </label>
  )
}

export function CampoArea({
  label,
  error,
  hint,
  opcional,
  completo = true,
  ref,
  ...rest
}: Base & TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm font-semibold ${completo ? 'col-span-full' : ''}`}>
      <Etiqueta label={label} opcional={opcional} />
      <textarea
        {...rest}
        ref={ref}
        aria-invalid={!!error}
        className={`${input} h-auto min-h-[96px] py-3 leading-normal ${error ? 'border-err' : 'border-line-strong'}`}
      />
      {error ? <MensajeError error={error} /> : hint && <span className="text-[13px] font-normal text-muted-2">{hint}</span>}
    </label>
  )
}

export function Casilla({ label, ref, ...rest }: { label: string; ref?: Ref<HTMLInputElement> } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-semibold">
      <input type="checkbox" {...rest} ref={ref} className="size-[18px] shrink-0 accent-primary" />
      {label}
    </label>
  )
}
