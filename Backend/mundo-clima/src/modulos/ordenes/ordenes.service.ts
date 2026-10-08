import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Orden } from './entidades/orden.entity';
import { ItemOrden } from './entidades/item-orden.entity';
import { Producto } from '../productos/entidades/producto.entity';
import { CrearOrdenDto } from './dto/crear-orden.dto';
import { FiltrarOrdenesDto } from './dto/filtrar-ordenes.dto';
import { Usuario } from '../usuarios/entidades/usuario.entity';
import {
  EstadoOrden,
  MetodoPago,
  RolUsuario,
  NivelCliente,
} from '../../comun/enums/hvac.enums';

export interface ResultadoOrdenesPaginadas {
  datos: Orden[];
  meta: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

/**
 * Servicio encargado de la gestión de órdenes de compra, cálculo de precios B2B server-side y control de inventario
 */
@Injectable()
export class OrdenesService {
  constructor(
    @InjectRepository(Orden)
    private readonly repositorioOrden: Repository<Orden>,
    @InjectRepository(ItemOrden)
    private readonly repositorioItemOrden: Repository<ItemOrden>,
    @InjectRepository(Producto)
    private readonly repositorioProducto: Repository<Producto>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Crea una nueva orden de compra ejecutando la validación y descuento de stock dentro de una transacción atómica
   */
  async crear(
    crearOrdenDto: CrearOrdenDto,
    usuarioAutenticado: Usuario,
  ): Promise<Orden> {
    const { items: itemsDto, metodo_pago, direccion_envio } = crearOrdenDto;

    if (!itemsDto || itemsDto.length === 0) {
      throw new BadRequestException(
        'La orden debe contener al menos un producto',
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      const repositorioProductoTx = manager.getRepository(Producto);
      const repositorioOrdenTx = manager.getRepository(Orden);
      const repositorioItemOrdenTx = manager.getRepository(ItemOrden);

      const itemsEntidad: ItemOrden[] = [];
      let subtotal = 0;

      for (const itemDto of itemsDto) {
        const producto = await repositorioProductoTx.findOne({
          where: { id: itemDto.producto_id, esta_activo: true },
          relations: { precios_nivel: true },
        });

        if (!producto) {
          throw new NotFoundException(
            `El producto con ID '${itemDto.producto_id}' no existe o no está activo`,
          );
        }

        if (producto.inventario_stock < itemDto.cantidad) {
          throw new BadRequestException(
            `El producto '${producto.nombre}' no tiene stock suficiente (Stock disponible: ${producto.inventario_stock})`,
          );
        }

        // Recalcular el precio unitario del producto server-side según el nivel/rol B2B del usuario autenticado
        const precioUnitario = this.calcularPrecioUnitarioB2B(
          producto,
          usuarioAutenticado.rol,
        );

        // Descontar inventario dentro de la transacción
        producto.inventario_stock -= itemDto.cantidad;
        await repositorioProductoTx.save(producto);

        // Crear snapshot del ítem de la orden
        const itemOrden = repositorioItemOrdenTx.create({
          producto_id: producto.id,
          nombre_producto: producto.nombre,
          cantidad: itemDto.cantidad,
          precio_unitario: precioUnitario,
        });

        itemsEntidad.push(itemOrden);
        subtotal += precioUnitario * itemDto.cantidad;
      }

      // TODO: tarifa fija por zona, pendiente de definir con el cliente
      const costo_envio = 0;
      const total = subtotal + costo_envio;

      // Generación de referencia única para la orden de compra
      const timestamp = Date.now();
      const sufijoRandom = Math.random()
        .toString(36)
        .substring(2, 7)
        .toUpperCase();
      const referencia = `ORD-${timestamp}-${sufijoRandom}`;

      // Determinar el estado inicial según el método de pago seleccionado
      const estado =
        metodo_pago === MetodoPago.CONTRAENTREGA
          ? EstadoOrden.CONFIRMADO_CONTRAENTREGA
          : EstadoOrden.PENDIENTE_PAGO;

      const nuevaOrden = repositorioOrdenTx.create({
        referencia,
        usuario_id: usuarioAutenticado.id,
        estado,
        metodo_pago,
        subtotal,
        costo_envio,
        total,
        direccion_envio,
        items: itemsEntidad,
      });

      return await repositorioOrdenTx.save(nuevaOrden);
    });
  }

  /**
   * Obtiene la lista de órdenes asociadas al usuario actualmente autenticado
   */
  async obtenerMisPedidos(usuarioId: string): Promise<Orden[]> {
    return await this.repositorioOrden.find({
      where: { usuario_id: usuarioId },
      relations: { items: true },
      order: { creado_en: 'DESC' },
    });
  }

  /**
   * Obtiene la lista paginada de todas las órdenes con opciones de filtrado para uso exclusivo del panel admin
   */
  async obtenerTodasAdmin(
    filtroDto: FiltrarOrdenesDto,
  ): Promise<ResultadoOrdenesPaginadas> {
    const {
      usuarioId,
      estado,
      desde,
      hasta,
      pagina = 1,
      limite = 10,
    } = filtroDto;

    const consulta = this.repositorioOrden
      .createQueryBuilder('orden')
      .leftJoinAndSelect('orden.items', 'items')
      .leftJoinAndSelect('orden.usuario', 'usuario');

    if (usuarioId) {
      consulta.andWhere('orden.usuario_id = :usuarioId', { usuarioId });
    }

    if (estado) {
      consulta.andWhere('orden.estado = :estado', { estado });
    }

    if (desde) {
      consulta.andWhere('orden.creado_en >= :desde', { desde });
    }

    if (hasta) {
      consulta.andWhere('orden.creado_en <= :hasta', { hasta });
    }

    consulta.orderBy('orden.creado_en', 'DESC');

    const salto = (pagina - 1) * limite;
    consulta.skip(salto).take(limite);

    const [ordenes, total] = await consulta.getManyAndCount();

    return {
      datos: ordenes,
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  }

  /**
   * Obtiene el detalle de una orden por su ID. Valida que pertenezca al usuario si no es Administrador.
   */
  async obtenerPorId(id: string, usuarioAutenticado: Usuario): Promise<Orden> {
    const orden = await this.repositorioOrden.findOne({
      where: { id },
      relations: { items: true, usuario: true },
    });

    if (!orden) {
      throw new NotFoundException(`La orden con ID '${id}' no fue encontrada`);
    }

    if (
      usuarioAutenticado.rol !== RolUsuario.ADMIN &&
      orden.usuario_id !== usuarioAutenticado.id
    ) {
      throw new ForbiddenException(
        'No tiene permisos para acceder a esta orden',
      );
    }

    return orden;
  }

  /**
   * Resuelve el precio aplicable de un producto según su nivel B2B o precio base
   */
  private calcularPrecioUnitarioB2B(
    producto: Producto,
    rolUsuario: RolUsuario,
  ): number {
    const precioBase = Number(producto.precio_base);

    if (
      rolUsuario !== RolUsuario.CLIENTE_FINAL &&
      producto.precios_nivel &&
      producto.precios_nivel.length > 0
    ) {
      const objetoPrecioNivel = producto.precios_nivel.find(
        (pn) => pn.nivel_cliente === rolUsuario && pn.cantidad_minima === 1,
      );

      if (objetoPrecioNivel) {
        return Number(objetoPrecioNivel.precio_especial);
      }
    }

    return precioBase;
  }
}
