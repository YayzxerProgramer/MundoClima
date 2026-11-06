import {
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudStock, EstadoSolicitudStock } from './entidades/solicitud-stock.entity';
import { Producto } from '../productos/entidades/producto.entity';
import { CrearSolicitudStockDto } from './dto/crear-solicitud-stock.dto';
import { ActualizarSolicitudStockDto } from './dto/actualizar-solicitud-stock.dto';
import { FiltrarSolicitudesStockDto } from './dto/filtrar-solicitudes-stock.dto';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

export interface ResultadoSolicitudesPaginadas {
  datos: SolicitudStock[];
  meta: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

@Injectable()
export class SolicitudesStockService {
  constructor(
    @InjectRepository(SolicitudStock)
    private readonly repositorioSolicitud: Repository<SolicitudStock>,
    @InjectRepository(Producto)
    private readonly repositorioProducto: Repository<Producto>,
    @Optional()
    private readonly notificacionesService?: NotificacionesService,
  ) {}

  /**
   * Crea una nueva solicitud de contacto / lead cuando un producto tiene stock en 0
   */
  async crear(
    dto: CrearSolicitudStockDto,
    usuarioId?: string,
  ): Promise<{ mensaje: string; solicitud: SolicitudStock }> {
    const esUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const { producto_id, ...resto } = dto;

    const producto = await this.repositorioProducto.findOne({
      where: esUuid.test(producto_id) ? { id: producto_id } : { slug: producto_id },
      relations: { categoria: true, marca: true },
    });

    if (!producto) {
      throw new NotFoundException(`El producto '${producto_id}' no fue encontrado`);
    }

    const nuevaSolicitud = this.repositorioSolicitud.create({
      ...resto,
      producto_id: producto.id,
      usuario_id: usuarioId || null,
      estado: EstadoSolicitudStock.PENDIENTE,
    });

    const solicitudGuardada = await this.repositorioSolicitud.save(nuevaSolicitud);

    // Disparar webhook a n8n para que el asesor reciba la alerta inmediata
    if (this.notificacionesService) {
      void this.notificacionesService.notificarSolicitudStock(solicitudGuardada, producto);
    }

    return {
      mensaje:
        'Tu solicitud ha sido recibida correctamente. Un asesor técnico comercial se comunicará contigo para brindarte todos los detalles.',
      solicitud: solicitudGuardada,
    };
  }

  /**
   * Listado paginado de solicitudes de stock para el panel de administración comercial
   */
  async obtenerTodas(
    filtroDto: FiltrarSolicitudesStockDto,
  ): Promise<ResultadoSolicitudesPaginadas> {
    const { q, estado, producto_id, pagina = 1, limite = 15 } = filtroDto;

    const consulta = this.repositorioSolicitud
      .createQueryBuilder('solicitud')
      .leftJoinAndSelect('solicitud.producto', 'producto')
      .leftJoinAndSelect('solicitud.usuario', 'usuario');

    if (q) {
      consulta.andWhere(
        '(solicitud.nombre_completo ILIKE :q OR solicitud.email ILIKE :q OR solicitud.telefono ILIKE :q OR solicitud.ciudad ILIKE :q OR producto.nombre ILIKE :q OR producto.sku ILIKE :q)',
        { q: `%${q}%` },
      );
    }

    if (estado) {
      consulta.andWhere('solicitud.estado = :estado', { estado });
    }

    if (producto_id) {
      consulta.andWhere('solicitud.producto_id = :producto_id', { producto_id });
    }

    consulta.orderBy('solicitud.creado_en', 'DESC');

    const salto = (pagina - 1) * limite;
    consulta.skip(salto).take(limite);

    const [datos, total] = await consulta.getManyAndCount();

    return {
      datos,
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  }

  /**
   * Consulta individual de una solicitud por su ID
   */
  async obtenerPorId(id: string): Promise<SolicitudStock> {
    const solicitud = await this.repositorioSolicitud.findOne({
      where: { id },
      relations: { producto: true, usuario: true },
    });

    if (!solicitud) {
      throw new NotFoundException(`La solicitud con ID '${id}' no existe`);
    }

    return solicitud;
  }

  /**
   * Actualiza el estado de la solicitud o agrega notas del asesor comercial
   */
  async actualizar(
    id: string,
    dto: ActualizarSolicitudStockDto,
  ): Promise<SolicitudStock> {
    const solicitud = await this.obtenerPorId(id);

    if (dto.estado !== undefined) {
      solicitud.estado = dto.estado;
    }
    if (dto.notas_asesor !== undefined) {
      solicitud.notas_asesor = dto.notas_asesor;
    }

    return await this.repositorioSolicitud.save(solicitud);
  }

  /**
   * Elimina una solicitud del registro comercial
   */
  async eliminar(id: string): Promise<{ mensaje: string }> {
    const solicitud = await this.obtenerPorId(id);
    await this.repositorioSolicitud.remove(solicitud);
    return {
      mensaje: `La solicitud de '${solicitud.nombre_completo}' fue eliminada correctamente`,
    };
  }
}
