import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useEliminarUsuario, useGuardarUsuario, useUsuarios } from '../../api/admin'
import { CabeceraAdmin } from '../../components/layout/AdminLayout'
import { AlertaError, Skeleton, Spinner } from '../../components/ui/basicos'
import { Campo } from '../../components/ui/Campo'
import { CampoSelect, Casilla } from '../../components/ui/CamposForm'
import { Icon } from '../../components/ui/Icon'
import { Modal } from '../../components/ui/Modal'
import { mensajeError } from '../../lib/api'
import { ROL_LABEL, TAG_NIVEL } from '../../lib/constantes'
import { btn, input, tarjeta } from '../../lib/estilos'
import { fmtFecha, normalizar } from '../../lib/formato'
import { useAuth } from '../../store/auth'
import { useUI } from '../../store/ui'
import type { Rol, Usuario } from '../../types/api'

const ROLES = Object.keys(ROL_LABEL) as Rol[]

const esquema = z.object({
  nombre_completo: z.string().trim().min(3, 'Escribe el nombre completo'),
  email: z.email('Escribe un correo válido'),
  password: z.string().refine((v) => !v || v.length >= 6, 'Usa al menos 6 caracteres'),
  rol: z.enum(['ADMIN', 'CLIENTE_FINAL', 'TECNICO', 'DISTRIBUIDOR']),
  telefono: z.string(),
  documento_identidad: z.string(),
  nombre_empresa: z.string(),
  esta_activo: z.boolean(),
})
type Valores = z.infer<typeof esquema>

const colorRol = (rol: Rol): [string, string] => (rol === 'ADMIN' ? ['#16232F', '#FFFFFF'] : (TAG_NIVEL[rol as 'TECNICO'] ?? ['#EEF1F4', '#16232F']))

function FormUsuario({ usuario, onListo }: { usuario?: Usuario; onListo: () => void }) {
  const guardar = useGuardarUsuario()
  const yo = useAuth((s) => s.usuario)
  const esYo = !!usuario && usuario.id === yo?.id
  const form = useForm<Valores>({
    resolver: zodResolver(
      esquema.superRefine((v, ctx) => {
        if (!usuario && v.password.length < 6) ctx.addIssue({ code: 'custom', path: ['password'], message: 'Usa al menos 6 caracteres' })
      }),
    ),
    defaultValues: {
      nombre_completo: usuario?.nombre_completo ?? '',
      email: usuario?.email ?? '',
      password: '',
      rol: usuario?.rol ?? 'CLIENTE_FINAL',
      telefono: usuario?.telefono ?? '',
      documento_identidad: usuario?.documento_identidad ?? '',
      nombre_empresa: usuario?.nombre_empresa ?? '',
      esta_activo: usuario?.esta_activo ?? true,
    },
  })
  const e = form.formState.errors

  const enviar = form.handleSubmit((v) =>
    guardar.mutate(
      {
        id: usuario?.id,
        body: {
          nombre_completo: v.nombre_completo.trim(),
          email: v.email.trim().toLowerCase(),
          ...(v.password ? { password: v.password } : {}),
          rol: v.rol,
          telefono: v.telefono.trim(),
          documento_identidad: v.documento_identidad.trim(),
          nombre_empresa: v.nombre_empresa.trim(),
          esta_activo: v.esta_activo,
        },
      },
      {
        onSuccess: (u) => {
          useUI.getState().avisar(usuario ? `Guardamos los cambios de ${u.nombre_completo}` : `Usuario ${u.nombre_completo} creado`)
          // Si el administrador editó su propia cuenta, la sesión muestra los datos nuevos.
          if (esYo) useAuth.getState().actualizarUsuario(u)
          onListo()
        },
      },
    ),
  )

  return (
    <form onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
      <Campo label="Nombre completo" autoComplete="off" completo error={e.nombre_completo?.message} {...form.register('nombre_completo')} />
      <Campo label="Correo electrónico" type="email" autoComplete="off" completo error={e.email?.message} {...form.register('email')} />
      <Campo
        label={usuario ? 'Nueva contraseña' : 'Contraseña inicial'}
        type="password"
        autoComplete="new-password"
        opcional={!!usuario}
        hint={usuario ? 'Déjala vacía para conservar la actual.' : 'Mínimo 6 caracteres.'}
        completo
        error={e.password?.message}
        {...form.register('password')}
      />
      {esYo ? (
        <div className="flex flex-col gap-1.5 text-sm font-semibold">
          Tipo de cuenta
          <span className="flex h-12 items-center rounded-md border border-line bg-soft px-3.5 font-normal">{usuario && ROL_LABEL[usuario.rol]}</span>
          <span className="text-[13px] font-normal text-muted-2">No puedes cambiar tu propio rol ni desactivarte.</span>
        </div>
      ) : (
        <CampoSelect label="Tipo de cuenta" {...form.register('rol')}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROL_LABEL[r]}
            </option>
          ))}
        </CampoSelect>
      )}
      <Campo label="Celular" type="tel" opcional {...form.register('telefono')} />
      <Campo label="Documento / NIT" opcional {...form.register('documento_identidad')} />
      <Campo label="Empresa" opcional {...form.register('nombre_empresa')} />
      {!esYo && (
        <div className="col-span-full">
          <Casilla label="Cuenta activa (puede iniciar sesión)" {...form.register('esta_activo')} />
        </div>
      )}
      {guardar.isError && (
        <div className="col-span-full">
          <AlertaError>{mensajeError(guardar.error, 'No pudimos guardar el usuario.')}</AlertaError>
        </div>
      )}
      <div className="col-span-full flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onListo} className={`${btn.base} ${btn.outline} h-11 px-5 text-[13px]`}>
          Cancelar
        </button>
        <button type="submit" disabled={guardar.isPending} className={`${btn.base} ${btn.primary} h-11 px-5 text-[13px]`}>
          {guardar.isPending && <Spinner size={16} color="#fff" />}
          {usuario ? 'Guardar cambios' : 'Crear usuario'}
        </button>
      </div>
    </form>
  )
}

export default function Usuarios() {
  const usuarios = useUsuarios()
  const eliminar = useEliminarUsuario()
  const yo = useAuth((s) => s.usuario)
  const [texto, setTexto] = useState('')
  const [rol, setRol] = useState<Rol | ''>('')
  const [editando, setEditando] = useState<Usuario | 'nuevo' | null>(null)
  const [borrando, setBorrando] = useState<Usuario | null>(null)

  const q = normalizar(texto.trim())
  const lista = (usuarios.data ?? []).filter(
    (u) => (!rol || u.rol === rol) && (!q || normalizar(`${u.nombre_completo} ${u.email} ${u.nombre_empresa ?? ''}`).includes(q)),
  )

  const confirmarBorrado = () =>
    borrando &&
    eliminar.mutate(borrando.id, {
      onSuccess: () => {
        useUI.getState().avisar(`Eliminamos a ${borrando.nombre_completo}`)
        setBorrando(null)
      },
    })

  return (
    <>
      <CabeceraAdmin eyebrow="Comunidad Mundo Clima" titulo="Usuarios">
        <button type="button" onClick={() => setEditando('nuevo')} className={`${btn.base} ${btn.primary} h-11 px-5 text-[13px]`}>
          <Icon name="person_add" size={20} />
          Nuevo usuario
        </button>
      </CabeceraAdmin>
      <div className="flex flex-wrap gap-3">
        <label className="relative block min-w-0 flex-[1_1_280px]">
          <span className="sr-only">Buscar por nombre, correo o empresa</span>
          <span className="pointer-events-none absolute top-1/2 left-3.5 flex -translate-y-1/2 text-muted">
            <Icon name="search" size={20} />
          </span>
          <input
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por nombre, correo o empresa…"
            className={`${input} w-full border-line-strong pl-11`}
          />
        </label>
        <select aria-label="Filtrar por tipo de cuenta" value={rol} onChange={(e) => setRol(e.target.value as Rol | '')} className={`${input} border-line-strong`}>
          <option value="">Todos los tipos de cuenta</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROL_LABEL[r]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        {usuarios.isError ? (
          <AlertaError>{mensajeError(usuarios.error)}</AlertaError>
        ) : usuarios.isPending ? (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-lg" />
            ))}
          </div>
        ) : !lista.length ? (
          <div className="rounded-lg border border-dashed border-line-strong px-5 py-10 text-center text-muted">No encontramos usuarios con ese filtro.</div>
        ) : (
          <>
            <div className="mb-2.5 text-[13px] text-muted">{lista.length} usuarios</div>
            <div className="flex flex-col gap-2.5">
              {lista.map((u) => {
                const [bg, fg] = colorRol(u.rol)
                const esYo = u.id === yo?.id
                return (
                  <div key={u.id} className={`${tarjeta} flex flex-wrap items-center gap-x-5 gap-y-3 px-[18px] py-3.5`}>
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-tint font-display text-base font-bold text-primary">
                      {(u.nombre_completo[0] ?? '?').toUpperCase()}
                    </span>
                    <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-0.5">
                      <span className="truncate text-sm font-semibold">
                        {u.nombre_completo}
                        {esYo && <span className="font-normal text-muted-2"> · tú</span>}
                      </span>
                      <span className="truncate text-[13px] text-muted-2">
                        {u.email}
                        {u.nombre_empresa ? ` · ${u.nombre_empresa}` : ''}
                      </span>
                    </div>
                    <span className="rounded-[3px] px-2 py-[3px] text-[11px] font-semibold tracking-[0.03em] whitespace-nowrap uppercase" style={{ background: bg, color: fg }}>
                      {ROL_LABEL[u.rol]}
                    </span>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${u.esta_activo === false ? 'text-muted' : 'text-ok'}`}>
                      <Icon name={u.esta_activo === false ? 'do_not_disturb_on' : 'check_circle'} size={17} />
                      {u.esta_activo === false ? 'Inactiva' : 'Activa'}
                    </span>
                    {u.creado_en && <span className="hidden text-[12.5px] whitespace-nowrap text-muted-2 xl:inline">Desde {fmtFecha(u.creado_en)}</span>}
                    <div className="ml-auto flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEditando(u)}
                        aria-label={`Editar a ${u.nombre_completo}`}
                        className="grid size-10 place-items-center rounded-md text-primary hover:bg-line-2"
                      >
                        <Icon name="edit" size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          eliminar.reset()
                          setBorrando(u)
                        }}
                        disabled={esYo}
                        title={esYo ? 'No puedes eliminar tu propia cuenta' : undefined}
                        aria-label={`Eliminar a ${u.nombre_completo}`}
                        className="grid size-10 place-items-center rounded-md text-err hover:bg-err-bg disabled:opacity-30"
                      >
                        <Icon name="trash-2" size={20} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <Modal abierto={!!editando} titulo={editando === 'nuevo' ? 'Nuevo usuario' : 'Editar usuario'} onCerrar={() => setEditando(null)} ancho="max-w-[620px]">
        {editando && (
          <FormUsuario key={editando === 'nuevo' ? 'nuevo' : editando.id} usuario={editando === 'nuevo' ? undefined : editando} onListo={() => setEditando(null)} />
        )}
      </Modal>

      <Modal abierto={!!borrando} titulo="Eliminar usuario" onCerrar={() => !eliminar.isPending && setBorrando(null)}>
        <p className="m-0 text-[15px] leading-relaxed">
          Vas a eliminar a <strong>{borrando?.nombre_completo}</strong> ({borrando?.email}). Esta acción no se puede deshacer.
        </p>
        <p className="m-0 mt-2 text-[13px] text-muted">Si solo quieres impedir que inicie sesión, edítalo y desmarca "Cuenta activa".</p>
        {eliminar.isError && (
          <div className="mt-4">
            <AlertaError>{mensajeError(eliminar.error, 'No pudimos eliminar el usuario. Si tiene pedidos, desactívalo en su lugar.')}</AlertaError>
          </div>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" disabled={eliminar.isPending} onClick={() => setBorrando(null)} className={`${btn.base} ${btn.outline} h-11 px-5 text-[13px]`}>
            Cancelar
          </button>
          <button type="button" disabled={eliminar.isPending} onClick={confirmarBorrado} className={`${btn.base} h-11 bg-err px-5 text-[13px] text-white hover:bg-err-ink`}>
            {eliminar.isPending && <Spinner size={16} color="#fff" />}
            Eliminar usuario
          </button>
        </div>
      </Modal>
    </>
  )
}
