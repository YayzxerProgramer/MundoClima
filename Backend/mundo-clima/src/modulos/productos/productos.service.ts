import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from './entidades/producto.entity';
import { PrecioNivelCliente } from './entidades/precio-nivel-cliente.entity';
import { FiltrarProductosDto, OrdenarProductosPor } from './dto/filtrar-productos.dto';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { NivelCliente } from '../../comun/enums/hvac.enums';

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

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly repositorioProducto: Repository<Producto>,
    @InjectRepository(PrecioNivelCliente)
    private readonly repositorioPrecioNivel: Repository<PrecioNivelCliente>,
  ) {}

  /**
   * Búsqueda y filtrado avanzado de productos con facetas estilo Homecenter y resolución de precios B2B
   */
  async obtenerTodos(filtroDto: FiltrarProductosDto): Promise<ResultadoProductosPaginados> {
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
      nivelCliente = NivelCliente.CLIENTE_FINAL,
      ordenarPor = OrdenarProductosPor.DESTACADOS,
      pagina = 1,
      limite = 12,
    } = filtroDto;

    const consulta = this.repositorioProducto
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .leftJoinAndSelect('producto.marca', 'marca')
      .leftJoinAndSelect('producto.precios_nivel', 'precios_nivel')
      .where('producto.esta_activo = :estaActivo', { estaActivo: true });

    // 1. Filtro por búsqueda de texto general
    if (q) {
      consulta.andWhere(
        '(producto.nombre ILIKE :q OR producto.sku ILIKE :q OR producto.descripcion ILIKE :q)',
        { q: `%${q}%` },
      );
    }

    // 2. Filtro por Categoría (Slug o ID)
    if (categoria) {
      consulta.andWhere(
        '(categoria.slug = :categoria OR categoria.id = :categoria OR categoria.categoria_padre_id = :categoria)',
        { categoria },
      );
    }

    // 3. Filtro por Marca (Slug o lista separada por comas)
    if (marca) {
      const listaMarcas = marca.split(',');
      consulta.andWhere('(marca.slug IN (:...listaMarcas) OR marca.id IN (:...listaMarcas))', {
        listaMarcas,
      });
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

    // 6. Filtro de Existencia en Inventario
    if (soloConStock) {
      consulta.andWhere('producto.inventario_stock > 0');
    }

    // 7. Criterio de Ordenamiento
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
      case OrdenarProductosPor.NOMBRE_AZ:
        consulta.orderBy('producto.nombre', 'ASC');
        break;
      case OrdenarProductosPor.DESTACADOS:
      default:
        consulta
          .orderBy('producto.es_destacado', 'DESC')
          .addOrderBy('producto.creado_en', 'DESC');
        break;
    }

    // 8. Paginación de resultados
    const salto = (pagina - 1) * limite;
    consulta.skip(salto).take(limite);

    const [productosSinProcesar, total] = await consulta.getManyAndCount();

    // 9. Cálculo y resolución de precios según nivel de cliente B2B
    const datosFormateados = productosSinProcesar.map((p) =>
      this.calcularPreciosPorNivelB2B(p, nivelCliente),
    );

    return {
      datos: datosFormateados,
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
   * Obtiene los metadatos de los filtros facetados estilo Homecenter
   */
  async obtenerOpcionesFiltros(): Promise<any> {
    const productos = await this.repositorioProducto.find({
      where: { esta_activo: true },
      relations: { marca: true, categoria: true },
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
      const valorPrecio = Number(p.precio_base);
      if (valorPrecio < precioMinimo) precioMinimo = valorPrecio;
      if (valorPrecio > precioMaximo) precioMaximo = valorPrecio;

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
   * Obtiene el detalle de un producto por ID o slug con precios B2B aplicados
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
   * Crea un nuevo producto en el catálogo
   */
  async crear(crearProductoDto: CrearProductoDto): Promise<Producto> {
    const { precios_nivel, ...datosProducto } = crearProductoDto;

    const producto = this.repositorioProducto.create(datosProducto);

    if (precios_nivel && precios_nivel.length > 0) {
      producto.precios_nivel = precios_nivel.map((pn) =>
        this.repositorioPrecioNivel.create({
          nivel_cliente: pn.nivel_cliente as NivelCliente,
          cantidad_minima: pn.cantidad_minima,
          precio_especial: pn.precio_especial,
        }),
      );
    }

    return this.repositorioProducto.save(producto);
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
}
