import type { InputHTMLAttributes, ReactNode } from 'react'
import { input } from '../../lib/estilos'
import { Icon } from './Icon'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  opcional?: boolean
  completo?: boolean
  extra?: ReactNode
}

/** Campo de formulario del diseño: etiqueta, input de 48px y error en rojo debajo. */
export function Campo({ label, error, hint, opcional, completo, extra, ...rest }: Props) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm font-semibold ${completo ? 'col-span-full' : ''}`}>
      <span>
        {label}
        {opcional && <span className="font-normal text-muted-2"> · opcional</span>}
      </span>
      <input {...rest} aria-invalid={!!error} className={`${input} ${error ? 'border-primary' : 'border-line-strong'}`} />
      {error ? (
        <span role="alert" className="flex items-center gap-1.5 text-[13px] font-medium text-err">
          <Icon name="circle-alert" size={14} />
          {error}
        </span>
      ) : (
        hint && <span className="text-[13px] font-normal text-muted-2">{hint}</span>
      )}
      {extra}
    </label>
  )
}
