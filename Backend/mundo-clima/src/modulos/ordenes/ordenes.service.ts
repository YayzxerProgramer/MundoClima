import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Orden } from './entidades/orden.entity';
import { ItemOrden } from './entidades/item-orden.entity';
import { Producto } from '../productos/entidades/producto.entity';
import { CrearOrdenDto } from './dto/crear-orden.dto';
import { FiltrarOrdenesDto } from './dto/filtrar-ordenes.dto';
import { ActualizarEstadoOrdenDto } from './dto/actualizar-estado-orden.dto';
import { AsignarGuiaOrdenDto } from './dto/asignar-guia-orden.dto';
import { Usuario } from '../usuarios/entidades/usuario.entity';
import { CoordinadoraService } from '../envios/coordinadora.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
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
    @Optional()
    private readonly coordinadoraService?: CoordinadoraService,
    @Optional()
    private readonly notificacionesService?: NotificacionesService,
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

      // Costo de envío base (gratis a partir de $300.000 COP)
      const costoEnvio = subtotal >= 300000 ? 0 : 15000;
      const total = subtotal + costoEnvio;

      // Generar referencia única de pedido estilo MC-2026-XXXXX
      const sufijoAleatorio = Math.floor(10000 + Math.random() * 90000);
      const referencia = `MC-2026-${sufijoAleatorio}`;

      // Determinar estado inicial según método de pago
      const estadoInicial =
        metodo_pago === MetodoPago.CONTRAENTREGA
          ? EstadoOrden.CONFIRMADO_CONTRAENTREGA
          : EstadoOrden.PENDIENTE_PAGO;

      const nuevaOrden = repositorioOrdenTx.create({
        referencia,
        usuario_id: usuarioAutenticado.id,
        estado: estadoInicial,
        metodo_pago,
        subtotal,
        costo_envio: costoEnvio,
        total,
        direccion_envio,
        items: itemsEntidad,
      });

      return await repositorioOrdenTx.save(nuevaOrden);
    });
  }

  /**
   * Obtiene las órdenes del usuario actualmente autenticado
   */
  async obtenerMisPedidos(usuarioId: string): Promise<Orden[]> {
    return await this.repositorioOrden.find({
      where: { usuario_id: usuarioId },
      relations: { items: true },
      order: { creado_en: 'DESC' },
    });
  }

  /**
   * Obtiene todas las órdenes de la plataforma con filtrado y paginación (Panel de Administración)
   */
  async obtenerTodasAdmin(
    filtroDto: FiltrarOrdenesDto,
  ): Promise<ResultadoOrdenesPaginadas> {
    const { estado, desde, hasta, pagina = 1, limite = 10 } = filtroDto;

    const consulta = this.repositorioOrden
      .createQueryBuilder('orden')
      .leftJoinAndSelect('orden.usuario', 'usuario')
      .leftJoinAndSelect('orden.items', 'items');

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
   * Actualiza el estado de una orden desde el panel de administración
   * Si la orden se cancela, se devuelve automáticamente el stock reservado
   */
  async actualizarEstado(
    id: string,
    dto: ActualizarEstadoOrdenDto,
  ): Promise<Orden> {
    const orden = await this.repositorioOrden.findOne({
      where: { id },
      relations: { items: true, usuario: true },
    });

    if (!orden) {
      throw new NotFoundException(`La orden con ID '${id}' no fue encontrada`);
    }

    const estadoAnterior = orden.estado;
    const nuevoEstado = dto.estado;

    // Si la orden pasa a CANCELADO y no estaba cancelada, restituir inventario
    if (nuevoEstado === EstadoOrden.CANCELADO && estadoAnterior !== EstadoOrden.CANCELADO) {
      for (const item of orden.items) {
        const producto = await this.repositorioProducto.findOne({
          where: { id: item.producto_id },
        });
        if (producto) {
          producto.inventario_stock += item.cantidad;
          await this.repositorioProducto.save(producto);
        }
      }
    }

    // Si la orden estaba CANCELADA y se reactiva a otro estado, descontar inventario
    if (estadoAnterior === EstadoOrden.CANCELADO && nuevoEstado !== EstadoOrden.CANCELADO) {
      for (const item of orden.items) {
        const producto = await this.repositorioProducto.findOne({
          where: { id: item.producto_id },
        });
        if (producto) {
          if (producto.inventario_stock < item.cantidad) {
            throw new BadRequestException(
              `No hay inventario suficiente para reactivar la orden. Producto '${producto.nombre}' solo tiene ${producto.inventario_stock} unidades disponibles.`,
            );
          }
          producto.inventario_stock -= item.cantidad;
          await this.repositorioProducto.save(producto);
        }
      }
    }

    orden.estado = nuevoEstado;
    const ordenGuardada = await this.repositorioOrden.save(orden);

    // Si pasa a PAGADO, emitir webhook de notificación si está disponible
    if (nuevoEstado === EstadoOrden.PAGADO && this.notificacionesService) {
      void this.notificacionesService.notificarOrdenPagada(ordenGuardada);
    }

    return ordenGuardada;
  }

  /**
   * Genera la guía de transporte con Coordinadora Mercantil y pasa la orden a EN_CAMINO
   */
  async despacharOrden(id: string): Promise<Orden> {
    const orden = await this.repositorioOrden.findOne({
      where: { id },
      relations: { items: true, usuario: true },
    });

    if (!orden) {
      throw new NotFoundException(`La orden con ID '${id}' no fue encontrada`);
    }

    if (orden.estado === EstadoOrden.CANCELADO) {
      throw new BadRequestException('No se puede generar guía de despacho para una orden cancelada');
    }

    const direccion = orden.direccion_envio || {};
    const destinatario = {
      nombre: orden.usuario?.nombre_completo || 'Cliente Mundo Clima',
      direccion: direccion.calle || 'Dirección de Entrega',
      ciudad: direccion.ciudad || 'Bogotá D.C.',
      telefono: direccion.telefono_contacto || orden.usuario?.telefono || '3000000000',
    };

    if (this.coordinadoraService) {
      const guia = await this.coordinadoraService.generarGuiaTransporte(
        orden.referencia,
        destinatario,
        2.5,
      );
      orden.coordinadora_numero_guia = guia.numero_guia;
      orden.coordinadora_estado_envio = guia.estado;
    } else {
      // Fallback si no está configurada la instancia del servicio
      const aleatorio = Math.floor(100000000 + Math.random() * 900000000);
      orden.coordinadora_numero_guia = `7700${aleatorio}`;
      orden.coordinadora_estado_envio = 'DESPACHADO';
    }

    orden.estado = EstadoOrden.EN_CAMINO;
    const ordenActualizada = await this.repositorioOrden.save(orden);

    // Disparar webhook de notificación a n8n
    if (this.notificacionesService) {
      void this.notificacionesService.notificarGuiaDespachada(ordenActualizada);
    }

    return ordenActualizada;
  }

  /**
   * Asignar manualmente número de guía y estado de envío de transportadora
   */
  async asignarGuiaManual(id: string, dto: AsignarGuiaOrdenDto): Promise<Orden> {
    const orden = await this.repositorioOrden.findOne({
      where: { id },
      relations: { items: true, usuario: true },
    });

    if (!orden) {
      throw new NotFoundException(`La orden con ID '${id}' no fue encontrada`);
    }

    orden.coordinadora_numero_guia = dto.coordinadora_numero_guia;
    if (dto.coordinadora_estado_envio) {
      orden.coordinadora_estado_envio = dto.coordinadora_estado_envio;
    }
    if (
      orden.estado === EstadoOrden.PAGADO ||
      orden.estado === EstadoOrden.CONFIRMADO_CONTRAENTREGA
    ) {
      orden.estado = EstadoOrden.EN_CAMINO;
    }

    return await this.repositorioOrden.save(orden);
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
