// Tipos de las respuestas reales del backend NestJS (prefijo /api).
// Los decimales de PostgreSQL llegan como string: convertir con Number() antes de operar.

export type Rol = 'ADMIN' | 'CLIENTE_FINAL' | 'TECNICO' | 'DISTRIBUIDOR'
export type NivelPrecio = Exclude<Rol, 'ADMIN'>

export type EstadoOrden =
  | 'PENDIENTE_PAGO'
  | 'PAGADO'
  | 'CONFIRMADO_CONTRAENTREGA'
  | 'EN_CAMINO'
  | 'ENTREGADO'
  | 'CANCELADO'

export type MetodoPago = 'WOMPI' | 'CONTRAENTREGA'

export type OrdenarPor = 'destacados' | 'precio_menor' | 'precio_mayor' | 'mas_recientes' | 'nombre_az'

export interface Categoria {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  imagen_url: string | null
  esta_activo: boolean
  categoria_padre_id: string | null
  /** Solo en GET /categorias (árbol). El tercer nivel no trae `hijos`. */
  hijos?: Categoria[]
  creado_en: string
  actualizado_en: string
}

export interface Marca {
  id: string
  nombre: string
  slug: string
  logo_url: string | null
  esta_activo: boolean
  creado_en: string
  actualizado_en: string
}

export interface PrecioNivel {
  id: string
  producto_id: string
  nivel_cliente: Rol
  cantidad_minima: number
  precio_especial: string
  creado_en: string
  actualizado_en: string
}

export interface Producto {
  id: string
  sku: string
  nombre: string
  slug: string
  descripcion: string | null
  descripcion_corta: string | null
  precio_base: number
  precio_costo?: string
  inventario_stock: number
  alerta_stock_minimo: number
  unidad_medida: string
  peso_kg: string
  esta_activo: boolean
  es_destacado: boolean
  imagenes: string[]
  btu: number | null
  tipo_refrigerante: string | null
  voltaje: string | null
  tipo_equipo: string | null
  especificaciones: Record<string, string | number> | null
  categoria_id: string | null
  categoria: Omit<Categoria, 'hijos'> | null
  marca_id: string | null
  marca: Marca | null
  precios_nivel: PrecioNivel[]
  creado_en: string
  actualizado_en: string
  /** Precio que el backend ya calculó para el nivel solicitado. Es el que se muestra. */
  precio_aplicado: number
  nivel_coincidido: Rol
  nivel_solicitado: Rol
  tiene_descuento_b2b: boolean
  monto_ahorro: number
  porcentaje_ahorro: number
  descuentos_por_volumen: PrecioNivel[]
}

export interface ListaProductos {
  datos: Producto[]
  meta: {
    total: number
    pagina: number
    limite: number
    totalPaginas: number
    nivelCliente: Rol
  }
}

export interface FacetaConteo {
  id: string
  nombre: string
  slug: string
  conteo: number
}

/** GET /productos/filtros: conteos globales sobre productos activos, no dependen de los filtros aplicados. */
export interface OpcionesFiltros {
  marcas: FacetaConteo[]
  categorias: FacetaConteo[]
  opcionesBtu: number[]
  refrigerantes: string[]
  voltajes: string[]
  tiposEquipo: string[]
  /** Calculado sobre precio_base. */
  rangoPrecio: { minimo: number; maximo: number }
}

export interface Usuario {
  id: string
  nombre_completo: string
  email: string
  rol: Rol
  telefono: string | null
  documento_identidad: string | null
  nombre_empresa: string | null
  esta_activo?: boolean
  creado_en?: string
  actualizado_en?: string
}

export interface RespuestaLogin {
  mensaje: string
  access_token: string
}

export interface RespuestaRegistro {
  mensaje: string
  access_token: string
  usuario: Usuario
}

export interface DireccionEnvio {
  calle: string
  ciudad: string
  departamento: string
  telefono_contacto: string
}

export interface ItemOrden {
  id: string
  orden_id: string
  producto_id: string
  nombre_producto: string
  cantidad: number
  precio_unitario: string
}

export interface Orden {
  id: string
  referencia: string
  usuario_id: string
  estado: EstadoOrden
  metodo_pago: MetodoPago
  subtotal: string
  costo_envio: string
  total: string
  direccion_envio: DireccionEnvio
  wompi_transaccion_id: string | null
  wompi_estado: string | null
  coordinadora_numero_guia: string | null
  coordinadora_url_rotulo: string | null
  coordinadora_estado_envio: string | null
  items: ItemOrden[]
  creado_en: string
  actualizado_en: string
}

export interface CrearOrdenBody {
  items: { producto_id: string; cantidad: number }[]
  metodo_pago: MetodoPago
  direccion_envio: DireccionEnvio
}

export interface CotizacionEnvio {
  transportadora: string
  flete_base: number
  costo_manejo: number
  total_flete: number
  dias_entrega_estimados: number
  ciudad_origen: string
  ciudad_destino: string
}

export interface Rastreo {
  numero_guia: string
  transportadora: string
  estado_actual: string
  ubicacion_actual: string
  historial: { fecha: string; evento: string }[]
}

export interface FirmaWompi {
  publicKey: string
  referencia: string
  montoEnCentavos: number
  moneda: string
  firmaIntegridad: string
  orden: {
    id: string
    referencia: string
    total: string
    cliente_email: string
    cliente_nombre: string
  }
}

/** Forma de los errores de NestJS (ValidationPipe y excepciones HTTP). */
export interface ErrorApi {
  statusCode: number
  message: string | string[]
  error?: string
}
