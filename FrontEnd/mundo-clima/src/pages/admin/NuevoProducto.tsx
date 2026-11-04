import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { useCrearProducto } from '../../api/admin'
import { useCategorias, useMarcas } from '../../api/catalogo'
import { CabeceraAdmin } from '../../components/layout/AdminLayout'
import { AlertaError, Spinner } from '../../components/ui/basicos'
import { Campo } from '../../components/ui/Campo'
import { CampoArea, CampoSelect, Casilla } from '../../components/ui/CamposForm'
import { Icon } from '../../components/ui/Icon'
import { mensajeError } from '../../lib/api'
import { btn, input, tarjeta } from '../../lib/estilos'
import { useUI } from '../../store/ui'
import type { Categoria } from '../../types/api'

const numero = (msg: string) => z.number(msg).nonnegative('No puede ser negativo')

const esquema = z.object({
  nombre: z.string().trim().min(3, 'Escribe el nombre del producto'),
  sku: z.string().trim().min(1, 'La referencia es obligatoria'),
  precio_base: numero('Escribe el precio'),
  precio_costo: z.number().nonnegative('No puede ser negativo').optional(),
  inventario_stock: numero('Escribe el stock').int('Usa un número entero'),
  alerta_stock_minimo: numero('Escribe el mínimo').int('Usa un número entero'),
  unidad_medida: z.string().trim().min(1, 'Escribe la unidad'),
  categoria_id: z.string(),
  marca_id: z.string(),
  descripcion_corta: z.string(),
  descripcion: z.string(),
  imagenes: z
    .string()
    .refine((v) => v.split('\n').map((u) => u.trim()).filter(Boolean).every((u) => /^https?:\/\/\S+$/.test(u)), 'Usa una URL https:// por línea'),
  esta_activo: z.boolean(),
  es_destacado: z.boolean(),
  btu: z.string().refine((v) => !v || /^\d+$/.test(v), 'Usa un número entero'),
  voltaje: z.string(),
  tipo_refrigerante: z.string(),
  tipo_equipo: z.string(),
  especificaciones: z.array(
    z.object({
      clave: z.string().trim().min(1, 'Escribe el atributo'),
      valor: z.string().trim().min(1, 'Escribe el valor'),
    }),
  ),
  precios_nivel: z.array(
    z.object({
      nivel_cliente: z.enum(['TECNICO', 'DISTRIBUIDOR']),
      cantidad_minima: z.number('Escribe la cantidad').int().min(1, 'Mínimo 1'),
      precio_especial: numero('Escribe el precio'),
    }),
  ),
})
type Valores = z.infer<typeof esquema>

/** Categorías con sus subcategorías, sangradas para el select. */
const planas = (cats: Categoria[], nivel = 0): { id: string; nombre: string }[] =>
  cats.flatMap((c) => [{ id: c.id, nombre: `${'— '.repeat(nivel)}${c.nombre}` }, ...planas(c.hijos ?? [], nivel + 1)])

const seccion = `${tarjeta} p-[clamp(16px,2.5vw,24px)]`
const h2 = 'm-0 mb-4 font-display text-lg font-bold'
const grid = 'grid gap-4 sm:grid-cols-2'
const opcional = (v: string) => (v.trim() ? v.trim() : undefined)

export default function NuevoProducto() {
  const navigate = useNavigate()
  const categorias = useCategorias()
  const marcas = useMarcas()
  const crear = useCrearProducto()
  const form = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombre: '',
      sku: '',
      precio_base: undefined,
      precio_costo: undefined,
      inventario_stock: 0,
      alerta_stock_minimo: 5,
      unidad_medida: 'Unidad',
      categoria_id: '',
      marca_id: '',
      descripcion_corta: '',
      descripcion: '',
      imagenes: '',
      esta_activo: true,
      es_destacado: false,
      btu: '',
      voltaje: '',
      tipo_refrigerante: '',
      tipo_equipo: '',
      especificaciones: [],
      precios_nivel: [],
    },
  })
  const specs = useFieldArray({ control: form.control, name: 'especificaciones' })
  const niveles = useFieldArray({ control: form.control, name: 'precios_nivel' })
  const e = form.formState.errors
  const num = { valueAsNumber: true } as const
  const costo = { setValueAs: (v: string) => (v === '' ? undefined : Number(v)) }

  const enviar = form.handleSubmit((v) =>
    crear.mutate(
      {
        nombre: v.nombre.trim(),
        sku: v.sku.trim(),
        precio_base: v.precio_base,
        ...(v.precio_costo != null ? { precio_costo: v.precio_costo } : {}),
        inventario_stock: v.inventario_stock,
        alerta_stock_minimo: v.alerta_stock_minimo,
        unidad_medida: v.unidad_medida.trim(),
        categoria_id: v.categoria_id || undefined,
        marca_id: v.marca_id || undefined,
        descripcion_corta: opcional(v.descripcion_corta),
        descripcion: opcional(v.descripcion),
        imagenes: v.imagenes.split('\n').map((u) => u.trim()).filter(Boolean),
        esta_activo: v.esta_activo,
        es_destacado: v.es_destacado,
        btu: v.btu ? Number(v.btu) : undefined,
        voltaje: opcional(v.voltaje),
        tipo_refrigerante: opcional(v.tipo_refrigerante),
        tipo_equipo: opcional(v.tipo_equipo),
        especificaciones: Object.fromEntries(v.especificaciones.map((s) => [s.clave.trim(), s.valor.trim()])),
        precios_nivel: v.precios_nivel,
      },
      {
        onSuccess: (p) => {
          useUI.getState().avisar(`Producto "${p.nombre}" creado`)
          navigate('/admin/productos')
        },
      },
    ),
  )

  return (
    <>
      <CabeceraAdmin eyebrow="Amplía tu catálogo" titulo="Nuevo producto">
        <Link to="/admin/productos" className="flex items-center gap-1.5 text-[13px] font-semibold text-primary-dark">
          <Icon name="arrow-left" size={16} />
          Volver a productos
        </Link>
      </CabeceraAdmin>
      <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
        <section className={seccion}>
          <h2 className={h2}>Información principal</h2>
          <div className={grid}>
            <Campo label="Nombre del producto" error={e.nombre?.message} completo {...form.register('nombre')} />
            <Campo label="SKU / referencia" error={e.sku?.message} {...form.register('sku')} />
            <Campo label="Unidad de medida" error={e.unidad_medida?.message} {...form.register('unidad_medida')} />
            <Campo label="Precio público (COP)" type="number" min="0" inputMode="numeric" error={e.precio_base?.message} {...form.register('precio_base', num)} />
            <Campo
              label="Precio de costo (COP)"
              type="number"
              min="0"
              inputMode="numeric"
              opcional
              hint="No se muestra en la tienda."
              error={e.precio_costo?.message}
              {...form.register('precio_costo', costo)}
            />
            <Campo label="Inventario disponible" type="number" min="0" inputMode="numeric" error={e.inventario_stock?.message} {...form.register('inventario_stock', num)} />
            <Campo
              label="Alerta de stock mínimo"
              type="number"
              min="0"
              inputMode="numeric"
              hint="Por debajo de este número aparece en las alertas del resumen."
              error={e.alerta_stock_minimo?.message}
              {...form.register('alerta_stock_minimo', num)}
            />
            <CampoSelect label="Categoría" opcional {...form.register('categoria_id')}>
              <option value="">Sin categoría</option>
              {planas(categorias.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </CampoSelect>
            <CampoSelect label="Marca" opcional {...form.register('marca_id')}>
              <option value="">Sin marca</option>
              {(marcas.data ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </CampoSelect>
            <Campo label="Descripción corta" opcional completo hint="Se muestra en la ficha y en la vista de lista." {...form.register('descripcion_corta')} />
            <CampoArea label="Descripción" opcional rows={5} {...form.register('descripcion')} />
            <CampoArea
              label="Imágenes"
              opcional
              rows={3}
              placeholder="https://…"
              hint="Una URL por línea."
              error={e.imagenes?.message}
              {...form.register('imagenes')}
            />
            <div className="col-span-full flex flex-wrap gap-x-8">
              <Casilla label="Producto activo (visible en la tienda)" {...form.register('esta_activo')} />
              <Casilla label="Producto destacado (aparece en el inicio)" {...form.register('es_destacado')} />
            </div>
          </div>
        </section>

        <section className={seccion}>
          <h2 className={h2}>Especificaciones técnicas</h2>
          <div className={grid}>
            <Campo label="Capacidad (BTU)" inputMode="numeric" opcional placeholder="12000" error={e.btu?.message} {...form.register('btu')} />
            <Campo label="Voltaje" opcional placeholder="220V 1Ph" {...form.register('voltaje')} />
            <Campo label="Refrigerante" opcional placeholder="R-410A" {...form.register('tipo_refrigerante')} />
            <Campo label="Tipo de equipo" opcional placeholder="Mini Split" {...form.register('tipo_equipo')} />
          </div>
          <div className="mt-5 flex flex-col gap-2.5">
            <span className="text-sm font-semibold">Otras especificaciones</span>
            {specs.fields.map((f, i) => (
              <div key={f.id} className="flex gap-2">
                <input aria-label={`Atributo ${i + 1}`} placeholder="Atributo" className={`${input} min-w-0 flex-1 border-line-strong`} {...form.register(`especificaciones.${i}.clave`)} />
                <input aria-label={`Valor ${i + 1}`} placeholder="Valor" className={`${input} min-w-0 flex-1 border-line-strong`} {...form.register(`especificaciones.${i}.valor`)} />
                <button
                  type="button"
                  onClick={() => specs.remove(i)}
                  aria-label={`Quitar especificación ${i + 1}`}
                  className="grid size-12 shrink-0 place-items-center rounded-md text-muted hover:bg-line-2 hover:text-err"
                >
                  <Icon name="trash-2" size={20} />
                </button>
              </div>
            ))}
            {e.especificaciones && <AlertaError>Completa el atributo y el valor de cada especificación.</AlertaError>}
            <button type="button" onClick={() => specs.append({ clave: '', valor: '' })} className={`${btn.base} ${btn.ghost} h-11 self-start px-4 text-[13px] normal-case`}>
              <Icon name="add" size={18} />
              Agregar especificación
            </button>
          </div>
        </section>

        <section className={seccion}>
          <h2 className={`${h2} mb-1`}>Precios para técnicos y distribuidores</h2>
          <p className="m-0 mb-4 text-[13px] text-muted">
            El precio con cantidad mínima 1 es el que ve cada nivel en la tienda; los demás son descuentos por volumen.
          </p>
          <div className="flex flex-col gap-2.5">
            {niveles.fields.map((f, i) => (
              <div key={f.id} className="grid items-end gap-3 rounded-md border border-line p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <CampoSelect label="Nivel" {...form.register(`precios_nivel.${i}.nivel_cliente`)}>
                  <option value="TECNICO">Técnico</option>
                  <option value="DISTRIBUIDOR">Distribuidor</option>
                </CampoSelect>
                <Campo
                  label="Desde cantidad"
                  type="number"
                  min="1"
                  error={e.precios_nivel?.[i]?.cantidad_minima?.message}
                  {...form.register(`precios_nivel.${i}.cantidad_minima`, num)}
                />
                <Campo
                  label="Precio (COP)"
                  type="number"
                  min="0"
                  error={e.precios_nivel?.[i]?.precio_especial?.message}
                  {...form.register(`precios_nivel.${i}.precio_especial`, num)}
                />
                <button
                  type="button"
                  onClick={() => niveles.remove(i)}
                  aria-label={`Quitar precio ${i + 1}`}
                  className="grid size-12 place-items-center rounded-md text-muted hover:bg-line-2 hover:text-err"
                >
                  <Icon name="trash-2" size={20} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => niveles.append({ nivel_cliente: 'TECNICO', cantidad_minima: 1, precio_especial: 0 })}
              className={`${btn.base} ${btn.ghost} h-11 self-start px-4 text-[13px] normal-case`}
            >
              <Icon name="add" size={18} />
              Agregar precio por nivel
            </button>
          </div>
        </section>

        {crear.isError && <AlertaError>{mensajeError(crear.error, 'No pudimos crear el producto.')}</AlertaError>}
        <div className="flex flex-wrap justify-end gap-3">
          <Link to="/admin/productos" className={`${btn.base} ${btn.outline} h-12 px-6 text-sm hover:no-underline`}>
            Cancelar
          </Link>
          <button type="submit" disabled={crear.isPending} className={`${btn.base} ${btn.primary} h-12 px-6 text-sm`}>
            {crear.isPending && <Spinner size={18} color="#fff" />}
            Crear producto
          </button>
        </div>
      </form>
    </>
  )
}
