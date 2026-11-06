import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from './entidades/producto.entity';
import { PrecioNivelCliente } from './entidades/precio-nivel-cliente.entity';
import { ItemOrden } from '../ordenes/entidades/item-orden.entity';
import { FiltrarProductosDto, OrdenarProductosPor } from './dto/filtrar-productos.dto';
import { FiltrarProductosAdminDto } from './dto/filtrar-productos-admin.dto';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto';
import { ActualizarStockDto } from './dto/actualizar-stock.dto';
import { NivelCliente } from '../../comun/enums/hvac.enums';
import { generarSlug } from '../../comun/utilidades/slug.util';

export interface ResultadoProductosPaginados {
  datos: any[];
  meta: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
    nivelCliente: NivelCliente;
  };
}

export interface ResultadoProductosAdminPaginados {
  datos: any[];
  meta: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly repositorioProducto: Repository<Producto>,
    @InjectRepository(PrecioNivelCliente)
    private readonly repositorioPrecioNivel: Repository<PrecioNivelCliente>,
    @InjectRepository(ItemOrden)
    private readonly repositorioItemOrden: Repository<ItemOrden>,
  ) {}

  /**
   * Búsqueda y filtrado avanzado de productos con facetas estilo Homecenter y resolución de precios B2B (Público y Admin)
   */
  async obtenerTodos(
    filtroDto: FiltrarProductosDto,
    esAdmin = false,
  ): Promise<ResultadoProductosPaginados> {
    const {
      q,
      categoria,
      marca,
      precioMinimo,
      precioMaximo,
      btu,
      refrigerante,
      voltaje,
      tipoEquipo,
      soloConStock,
      incluirInactivos,
      esta_activo,
      nivelCliente = NivelCliente.CLIENTE_FINAL,
      ordenarPor = OrdenarProductosPor.DESTACADOS,
      pagina = 1,
      limite = 12,
    } = filtroDto;

    const consulta = this.repositorioProducto
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .leftJoinAndSelect('producto.marca', 'marca')
      .leftJoinAndSelect('producto.precios_nivel', 'precios_nivel');

    // Manejo de estado activo / inactivo:
    if (esta_activo !== undefined) {
      consulta.andWhere('producto.esta_activo = :estaActivo', { estaActivo: esta_activo });
    } else if (incluirInactivos === true || esAdmin) {
      // Los administradores o quienes indiquen incluirInactivos ven tanto activos como inactivos
    } else {
      // Clientes y tienda pública solo ven productos activos
      consulta.andWhere('producto.esta_activo = :estaActivo', { estaActivo: true });
    }

    // 1. Filtro por búsqueda de texto general
    if (q) {
      consulta.andWhere(
        '(producto.nombre ILIKE :q OR producto.sku ILIKE :q OR producto.descripcion ILIKE :q)',
        { q: `%${q}%` },
      );
    }

    const esUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // 2. Filtro por Categoría (Slug o UUID)
    if (categoria) {
      if (esUuid.test(categoria)) {
        consulta.andWhere(
          '(categoria.id = :categoria OR categoria.categoria_padre_id = :categoria)',
          { categoria },
        );
      } else {
        consulta.andWhere('categoria.slug = :categoria', { categoria });
      }
    }

    // 3. Filtro por Marca (Slug o UUID o lista separada por comas)
    if (marca) {
      const listaMarcas = marca.split(',').map((m) => m.trim()).filter(Boolean);
      const uuids = listaMarcas.filter((m) => esUuid.test(m));
      const slugs = listaMarcas.filter((m) => !esUuid.test(m));

      const condicionesMarca: string[] = [];
      const paramsMarca: Record<string, any> = {};

      if (slugs.length > 0) {
        condicionesMarca.push('marca.slug IN (:...slugsMarca)');
        paramsMarca.slugsMarca = slugs;
      }
      if (uuids.length > 0) {
        condicionesMarca.push('marca.id IN (:...uuidsMarca)');
        paramsMarca.uuidsMarca = uuids;
      }

      if (condicionesMarca.length > 0) {
        consulta.andWhere(`(${condicionesMarca.join(' OR ')})`, paramsMarca);
      }
    }

    // 4. Filtro por Rango de Precio
    if (precioMinimo !== undefined) {
      consulta.andWhere('producto.precio_base >= :precioMinimo', { precioMinimo });
    }
    if (precioMaximo !== undefined) {
      consulta.andWhere('producto.precio_base <= :precioMaximo', { precioMaximo });
    }

    // 5. Filtros Técnicos Específicos de HVAC/R
    if (btu !== undefined) {
      consulta.andWhere('producto.btu = :btu', { btu });
    }
    if (refrigerante) {
      consulta.andWhere('producto.tipo_refrigerante = :refrigerante', { refrigerante });
    }
    if (voltaje) {
      consulta.andWhere('producto.voltaje = :voltaje', { voltaje });
    }
    if (tipoEquipo) {
      consulta.andWhere('producto.tipo_equipo = :tipoEquipo', { tipoEquipo });
    }

    // 6. Filtro de disponibilidad inmediata
    if (soloConStock) {
      consulta.andWhere('producto.inventario_stock > 0');
    }

    // 7. Ordenamiento dinámico
    switch (ordenarPor) {
      case OrdenarProductosPor.PRECIO_MENOR:
        consulta.orderBy('producto.precio_base', 'ASC');
        break;
      case OrdenarProductosPor.PRECIO_MAYOR:
        consulta.orderBy('producto.precio_base', 'DESC');
        break;
      case OrdenarProductosPor.MAS_RECIENTES:
        consulta.orderBy('producto.creado_en', 'DESC');
        break;
      case OrdenarProductosPor.DESTACADOS:
      default:
        consulta.orderBy('producto.es_destacado', 'DESC').addOrderBy('producto.creado_en', 'DESC');
        break;
    }

    // Paginación
    const salto = (pagina - 1) * limite;
    consulta.skip(salto).take(limite);

    const [productos, total] = await consulta.getManyAndCount();

    // Resolver precios según el rol o nivel de cliente B2B
    const datosMapeados = productos.map((producto) =>
      this.calcularPreciosPorNivelB2B(producto, nivelCliente),
    );

    return {
      datos: datosMapeados,
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
        nivelCliente,
      },
    };
  }

  /**
   * Listado completo de productos para el panel de administración (incluyendo inactivos, paginado)
   */
  async obtenerTodosAdmin(
    filtroDto: FiltrarProductosAdminDto,
  ): Promise<ResultadoProductosAdminPaginados> {
    const {
      q,
      categoria_id,
      marca_id,
      esta_activo,
      solo_stock_bajo,
      ordenarPor,
      pagina = 1,
      limite = 15,
    } = filtroDto;

    const consulta = this.repositorioProducto
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .leftJoinAndSelect('producto.marca', 'marca')
      .leftJoinAndSelect('producto.precios_nivel', 'precios_nivel');

    if (q) {
      consulta.andWhere(
        '(producto.nombre ILIKE :q OR producto.sku ILIKE :q OR producto.descripcion ILIKE :q)',
        { q: `%${q}%` },
      );
    }

    if (categoria_id) {
      consulta.andWhere('(categoria.id = :catId OR categoria.slug = :catId)', {
        catId: categoria_id,
      });
    }

    if (marca_id) {
      consulta.andWhere('(marca.id = :marcaId OR marca.slug = :marcaId)', {
        marcaId: marca_id,
      });
    }

    if (esta_activo !== undefined && esta_activo !== '') {
      const activoBool = esta_activo === true || esta_activo === 'true';
      consulta.andWhere('producto.esta_activo = :activoBool', { activoBool });
    }

    if (solo_stock_bajo === true || solo_stock_bajo === 'true') {
      consulta.andWhere('producto.inventario_stock <= producto.alerta_stock_minimo');
    }

    // Ordenamiento
    if (ordenarPor === 'precio_asc') {
      consulta.orderBy('producto.precio_base', 'ASC');
    } else if (ordenarPor === 'precio_desc') {
      consulta.orderBy('producto.precio_base', 'DESC');
    } else if (ordenarPor === 'stock_asc') {
      consulta.orderBy('producto.inventario_stock', 'ASC');
    } else if (ordenarPor === 'nombre_asc') {
      consulta.orderBy('producto.nombre', 'ASC');
    } else {
      consulta.orderBy('producto.creado_en', 'DESC');
    }

    const salto = (pagina - 1) * limite;
    consulta.skip(salto).take(limite);

    const [productos, total] = await consulta.getManyAndCount();

    return {
      datos: productos,
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  }

  /**
   * Obtiene las opciones de facetas disponibles para los filtros
   */
  async obtenerOpcionesFiltros(): Promise<any> {
    const productos = await this.repositorioProducto.find({
      where: { esta_activo: true },
      relations: { categoria: true, marca: true },
    });

    const mapaMarcas = new Map<string, { id: string; nombre: string; slug: string; conteo: number }>();
    const mapaCategorias = new Map<string, { id: string; nombre: string; slug: string; conteo: number }>();
    const conjuntoBtu = new Set<number>();
    const conjuntoRefrigerantes = new Set<string>();
    const conjuntoVoltajes = new Set<string>();
    const conjuntoTiposEquipo = new Set<string>();

    let precioMinimo = Infinity;
    let precioMaximo = -Infinity;

    productos.forEach((p) => {
      const precio = Number(p.precio_base);
      if (precio < precioMinimo) precioMinimo = precio;
      if (precio > precioMaximo) precioMaximo = precio;

      if (p.marca) {
        const existente = mapaMarcas.get(p.marca.id) || {
          id: p.marca.id,
          nombre: p.marca.nombre,
          slug: p.marca.slug,
          conteo: 0,
        };
        existente.conteo += 1;
        mapaMarcas.set(p.marca.id, existente);
      }

      if (p.categoria) {
        const existente = mapaCategorias.get(p.categoria.id) || {
          id: p.categoria.id,
          nombre: p.categoria.nombre,
          slug: p.categoria.slug,
          conteo: 0,
        };
        existente.conteo += 1;
        mapaCategorias.set(p.categoria.id, existente);
      }

      if (p.btu) conjuntoBtu.add(p.btu);
      if (p.tipo_refrigerante) conjuntoRefrigerantes.add(p.tipo_refrigerante);
      if (p.voltaje) conjuntoVoltajes.add(p.voltaje);
      if (p.tipo_equipo) conjuntoTiposEquipo.add(p.tipo_equipo);
    });

    return {
      marcas: Array.from(mapaMarcas.values()).sort((a, b) => a.nombre.localeCompare(b.nombre)),
      categorias: Array.from(mapaCategorias.values()).sort((a, b) => a.nombre.localeCompare(b.nombre)),
      opcionesBtu: Array.from(conjuntoBtu).sort((a, b) => a - b),
      refrigerantes: Array.from(conjuntoRefrigerantes).sort(),
      voltajes: Array.from(conjuntoVoltajes).sort(),
      tiposEquipo: Array.from(conjuntoTiposEquipo).sort(),
      rangoPrecio: {
        minimo: precioMinimo === Infinity ? 0 : precioMinimo,
        maximo: precioMaximo === -Infinity ? 0 : precioMaximo,
      },
    };
  }

  /**
   * Obtiene el detalle de un producto por ID o slug con precios B2B aplicados (Público)
   */
  async obtenerPorSlugOId(identificador: string, nivelCliente: NivelCliente = NivelCliente.CLIENTE_FINAL): Promise<any> {
    const esUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        identificador,
      );

    const producto = await this.repositorioProducto.findOne({
      where: esUuid ? { id: identificador } : { slug: identificador },
      relations: { categoria: true, marca: true, precios_nivel: true },
    });

    if (!producto) {
      throw new NotFoundException(`El producto '${identificador}' no fue encontrado`);
    }

    return this.calcularPreciosPorNivelB2B(producto, nivelCliente);
  }

  /**
   * Obtiene un producto por su ID para el panel de administración
   */
  async obtenerPorIdAdmin(id: string): Promise<Producto> {
    const producto = await this.repositorioProducto.findOne({
      where: { id },
      relations: { categoria: true, marca: true, precios_nivel: true },
    });

    if (!producto) {
      throw new NotFoundException(`El producto con ID '${id}' no fue encontrado`);
    }

    return producto;
  }

  /**
   * Crea un nuevo producto en el catálogo desde el panel de administración
   */
  async crear(crearProductoDto: CrearProductoDto): Promise<Producto> {
    const { precios_nivel, slug, ...datosProducto } = crearProductoDto;

    // Verificar si el SKU ya existe
    const skuExistente = await this.repositorioProducto.findOne({
      where: { sku: datosProducto.sku.trim() },
    });
    if (skuExistente) {
      throw new ConflictException(`El SKU '${datosProducto.sku}' ya está registrado en otro producto`);
    }

    // Generar slug amigable para SEO
    const slugBase = slug ? generarSlug(slug) : generarSlug(datosProducto.nombre);
    let slugFinal = slugBase;
    let contador = 1;
    while (await this.repositorioProducto.findOne({ where: { slug: slugFinal } })) {
      slugFinal = `${slugBase}-${contador++}`;
    }

    const producto = this.repositorioProducto.create({
      ...datosProducto,
      sku: datosProducto.sku.trim(),
      slug: slugFinal,
    });

    if (precios_nivel && precios_nivel.length > 0) {
      producto.precios_nivel = precios_nivel.map((pn) =>
        this.repositorioPrecioNivel.create({
          nivel_cliente: pn.nivel_cliente as NivelCliente,
          cantidad_minima: pn.cantidad_minima,
          precio_especial: pn.precio_especial,
        }),
      );
    }

    return await this.repositorioProducto.save(producto);
  }

  /**
   * Actualiza los datos de un producto existente
   */
  async actualizar(id: string, actualizarProductoDto: ActualizarProductoDto): Promise<Producto> {
    const producto = await this.obtenerPorIdAdmin(id);
    const { precios_nivel, slug, sku, ...restoDatos } = actualizarProductoDto;

    // Verificar SKU si cambió
    if (sku && sku.trim() !== producto.sku) {
      const skuExistente = await this.repositorioProducto.findOne({
        where: { sku: sku.trim() },
      });
      if (skuExistente && skuExistente.id !== id) {
        throw new ConflictException(`El SKU '${sku}' ya está en uso por otro producto`);
      }
      producto.sku = sku.trim();
    }

    // Actualizar slug si se especificó
    if (slug) {
      const nuevoSlug = generarSlug(slug);
      if (nuevoSlug !== producto.slug) {
        const existente = await this.repositorioProducto.findOne({
          where: { slug: nuevoSlug },
        });
        if (existente && existente.id !== id) {
          throw new ConflictException(`El slug '${nuevoSlug}' ya está en uso por otro producto`);
        }
        producto.slug = nuevoSlug;
      }
    }

    // Manejar precios por nivel B2B
    if (precios_nivel !== undefined) {
      // Eliminar precios de nivel anteriores
      if (producto.precios_nivel && producto.precios_nivel.length > 0) {
        await this.repositorioPrecioNivel.remove(producto.precios_nivel);
      }

      producto.precios_nivel = precios_nivel.map((pn) =>
        this.repositorioPrecioNivel.create({
          producto_id: id,
          nivel_cliente: pn.nivel_cliente as NivelCliente,
          cantidad_minima: pn.cantidad_minima,
          precio_especial: pn.precio_especial,
        }),
      );
    }

    Object.assign(producto, restoDatos);
    return await this.repositorioProducto.save(producto);
  }

  /**
   * Actualización rápida de stock desde el panel de administración
   */
  async actualizarStock(id: string, dto: ActualizarStockDto): Promise<Producto> {
    const producto = await this.obtenerPorIdAdmin(id);
    producto.inventario_stock = dto.inventario_stock;
    if (dto.alerta_stock_minimo !== undefined) {
      producto.alerta_stock_minimo = dto.alerta_stock_minimo;
    }
    return await this.repositorioProducto.save(producto);
  }

  /**
   * Activar o desactivar producto rápidamente
   */
  async actualizarEstado(id: string, esta_activo: boolean): Promise<Producto> {
    const producto = await this.obtenerPorIdAdmin(id);
    producto.esta_activo = esta_activo;
    return await this.repositorioProducto.save(producto);
  }

  /**
   * Elimina un producto o realiza borrado lógico si ya tiene órdenes de compra asociadas
   */
  async eliminar(id: string): Promise<{ mensaje: string; borrado_logico?: boolean }> {
    const producto = await this.obtenerPorIdAdmin(id);

    // Validar si el producto está en órdenes
    const conteoEnOrdenes = await this.repositorioItemOrden.count({
      where: { producto_id: id },
    });

    if (conteoEnOrdenes > 0) {
      // Si ya tiene órdenes de compra, no se puede eliminar físicamente por integridad financiera
      producto.esta_activo = false;
      await this.repositorioProducto.save(producto);
      return {
        mensaje: `El producto '${producto.nombre}' fue desactivado porque tiene ${conteoEnOrdenes} órdenes asociadas en el historial`,
        borrado_logico: true,
      };
    }

    // Si no está en ninguna orden, eliminar precios por nivel y luego el producto
    if (producto.precios_nivel && producto.precios_nivel.length > 0) {
      await this.repositorioPrecioNivel.remove(producto.precios_nivel);
    }

    await this.repositorioProducto.remove(producto);
    return {
      mensaje: `El producto '${producto.nombre}' (SKU: ${producto.sku}) fue eliminado permanentemente del catálogo`,
      borrado_logico: false,
    };
  }

  /**
   * Función interna para resolver precios B2B y ahorros según el perfil del cliente
   */
  private calcularPreciosPorNivelB2B(producto: Producto, nivelCliente: NivelCliente) {
    const precioBase = Number(producto.precio_base);
    let precioAplicado = precioBase;
    let nivelCoincidido = NivelCliente.CLIENTE_FINAL;

    if (nivelCliente !== NivelCliente.CLIENTE_FINAL && producto.precios_nivel && producto.precios_nivel.length > 0) {
      const objetoPrecioNivel = producto.precios_nivel.find(
        (pn) => pn.nivel_cliente === nivelCliente && pn.cantidad_minima === 1,
      );

      if (objetoPrecioNivel) {
        precioAplicado = Number(objetoPrecioNivel.precio_especial);
        nivelCoincidido = nivelCliente;
      }
    }

    const montoAhorro = Math.max(0, precioBase - precioAplicado);
    const porcentajeAhorro = precioBase > 0 ? Math.round((montoAhorro / precioBase) * 100) : 0;

    return {
      ...producto,
      precio_base: precioBase,
      precio_aplicado: precioAplicado,
      nivel_coincidido: nivelCoincidido,
      nivel_solicitado: nivelCliente,
      tiene_descuento_b2b: precioAplicado < precioBase,
      monto_ahorro: montoAhorro,
      porcentaje_ahorro: porcentajeAhorro,
      descuentos_por_volumen: producto.precios_nivel || [],
    };
  }

  /**
   * Compara hasta 4 productos HVAC/R devolviendo una matriz técnica normalizada y resaltado de diferencias
   */
  async compararProductos(
    identificadores: string[],
    nivelCliente: NivelCliente = NivelCliente.CLIENTE_FINAL,
  ): Promise<any> {
    const esUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const uuids = identificadores.filter((id) => esUuid.test(id));
    const slugs = identificadores.filter((id) => !esUuid.test(id));

    const consulta = this.repositorioProducto
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .leftJoinAndSelect('producto.marca', 'marca')
      .leftJoinAndSelect('producto.precios_nivel', 'precios_nivel')
      .where('producto.esta_activo = :estaActivo', { estaActivo: true });

    const condiciones: string[] = [];
    const params: Record<string, any> = {};

    if (uuids.length > 0) {
      condiciones.push('producto.id IN (:...uuids)');
      params.uuids = uuids;
    }
    if (slugs.length > 0) {
      condiciones.push('producto.slug IN (:...slugs)');
      params.slugs = slugs;
    }

    if (condiciones.length === 0) {
      return { productos: [], matriz_especificaciones: [], atributos_diferentes: [] };
    }

    consulta.andWhere(`(${condiciones.join(' OR ')})`, params);
    const productosEncontrados = await consulta.getMany();

    // Mapear con precios resueltos y estado de disponibilidad
    const productos = productosEncontrados.map((p) => {
      const b2b = this.calcularPreciosPorNivelB2B(p, nivelCliente);
      const stock = Number(p.inventario_stock || 0);
      return {
        ...b2b,
        disponibilidad: stock > 0 ? 'EN_STOCK' : 'BAJO_PEDIDO',
        es_bajo_pedido: stock <= 0,
      };
    });

    // Recolectar todas las claves de especificaciones técnicas personalizadas
    const conjuntoClavesSpecs = new Set<string>();
    productos.forEach((p) => {
      if (p.especificaciones && typeof p.especificaciones === 'object') {
        Object.keys(p.especificaciones).forEach((k) => conjuntoClavesSpecs.add(k));
      }
    });

    interface FilaComparativa {
      grupo: string;
      clave: string;
      etiqueta: string;
      valores: Record<string, any>;
      es_diferente: boolean;
    }

    const filas: FilaComparativa[] = [
      {
        grupo: 'Identificación',
        clave: 'marca',
        etiqueta: 'Marca',
        valores: {},
        es_diferente: false,
      },
      {
        grupo: 'Identificación',
        clave: 'categoria',
        etiqueta: 'Categoría',
        valores: {},
        es_diferente: false,
      },
      {
        grupo: 'Identificación',
        clave: 'sku',
        etiqueta: 'Referencia / SKU',
        valores: {},
        es_diferente: false,
      },
      {
        grupo: 'Capacidad y Clima',
        clave: 'btu',
        etiqueta: 'Capacidad Térmica (BTU / TR)',
        valores: {},
        es_diferente: false,
      },
      {
        grupo: 'Capacidad y Clima',
        clave: 'tipo_equipo',
        etiqueta: 'Tipo de Equipo',
        valores: {},
        es_diferente: false,
      },
      {
        grupo: 'Refrigeración',
        clave: 'tipo_refrigerante',
        etiqueta: 'Gas Refrigerante',
        valores: {},
        es_diferente: false,
      },
      {
        grupo: 'Sistema Eléctrico',
        clave: 'voltaje',
        etiqueta: 'Voltaje y Fases',
        valores: {},
        es_diferente: false,
      },
      {
        grupo: 'Dimensiones y Peso',
        clave: 'peso_kg',
        etiqueta: 'Peso',
        valores: {},
        es_diferente: false,
      },
      {
        grupo: 'Disponibilidad y Compra',
        clave: 'precio_base',
        etiqueta: 'Precio Base (COP)',
        valores: {},
        es_diferente: false,
      },
      {
        grupo: 'Disponibilidad y Compra',
        clave: 'precio_aplicado',
        etiqueta: 'Tu Precio B2B (COP)',
        valores: {},
        es_diferente: false,
      },
      {
        grupo: 'Disponibilidad y Compra',
        clave: 'disponibilidad',
        etiqueta: 'Estado de Inventario',
        valores: {},
        es_diferente: false,
      },
    ];

    // Agregar especificaciones dinámicas
    Array.from(conjuntoClavesSpecs).sort().forEach((clave) => {
      filas.push({
        grupo: 'Especificaciones Técnicas Detalladas',
        clave: `spec_${clave}`,
        etiqueta: clave,
        valores: {},
        es_diferente: false,
      });
    });

    const atributosDiferentes: string[] = [];

    // Poblar valores y calcular si difieren entre productos
    filas.forEach((fila) => {
      const valoresUnicos = new Set<string>();

      productos.forEach((p) => {
        let val: any = null;
        if (fila.clave === 'marca') val = p.marca?.nombre || 'Genérica';
        else if (fila.clave === 'categoria') val = p.categoria?.nombre || 'General';
        else if (fila.clave === 'sku') val = p.sku;
        else if (fila.clave === 'btu') {
          if (p.btu) {
            const tr = (p.btu / 12000).toFixed(1).replace('.0', '');
            val = `${Number(p.btu).toLocaleString('es-CO')} BTU (${tr} TR)`;
          } else {
            val = 'No aplica';
          }
        } else if (fila.clave === 'tipo_equipo') val = p.tipo_equipo || 'Estándar';
        else if (fila.clave === 'tipo_refrigerante') val = p.tipo_refrigerante || 'No aplica';
        else if (fila.clave === 'voltaje') val = p.voltaje || 'No aplica';
        else if (fila.clave === 'peso_kg') val = p.peso_kg ? `${p.peso_kg} kg` : 'No especificado';
        else if (fila.clave === 'precio_base') val = Number(p.precio_base);
        else if (fila.clave === 'precio_aplicado') val = Number(p.precio_aplicado);
        else if (fila.clave === 'disponibilidad') {
          val = p.disponibilidad === 'EN_STOCK' ? 'En stock' : 'Bajo pedido (contacto asesor)';
        } else if (fila.clave.startsWith('spec_')) {
          const specKey = fila.clave.replace('spec_', '');
          val = p.especificaciones?.[specKey] ?? '—';
        }

        fila.valores[p.id] = val;
        valoresUnicos.add(String(val ?? ''));
      });

      if (valoresUnicos.size > 1 && productos.length > 1) {
        fila.es_diferente = true;
        atributosDiferentes.push(fila.clave);
      }
    });

    return {
      total_productos: productos.length,
      productos,
      matriz_especificaciones: filas,
      atributos_diferentes: atributosDiferentes,
    };
  }
}
