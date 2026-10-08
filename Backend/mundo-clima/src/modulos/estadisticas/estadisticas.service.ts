import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { Orden } from '../ordenes/entidades/orden.entity';
import { Producto } from '../productos/entidades/producto.entity';
import { Usuario } from '../usuarios/entidades/usuario.entity';
import { VisitaTienda } from './entidades/visita-tienda.entity';
import { EstadoOrden, RolUsuario } from '../../comun/enums/hvac.enums';
import { FiltrarEstadisticasDto } from './dto/filtrar-estadisticas.dto';

@Injectable()
export class EstadisticasService {
  private readonly logger = new Logger(EstadisticasService.name);

  constructor(
    @InjectRepository(Orden)
    private readonly repositorioOrden: Repository<Orden>,
    @InjectRepository(Producto)
    private readonly repositorioProducto: Repository<Producto>,
    @InjectRepository(Usuario)
    private readonly repositorioUsuario: Repository<Usuario>,
    @InjectRepository(VisitaTienda)
    private readonly repositorioVisita: Repository<VisitaTienda>,
  ) {}

  /**
   * Obtiene el resumen consolidado de KPIs financieros, órdenes, inventario y clientes
   */
  async obtenerResumenGeneral() {
    // Órdenes completadas o aprobadas para cálculo de ingresos reales
    const estadosAprobados = [
      EstadoOrden.PAGADO,
      EstadoOrden.EN_CAMINO,
      EstadoOrden.ENTREGADO,
      EstadoOrden.CONFIRMADO_CONTRAENTREGA,
    ];

    // 1. Ingresos Totales acumulados
    const consultaVentas = await this.repositorioOrden
      .createQueryBuilder('orden')
      .select('SUM(orden.total)', 'total_ventas')
      .select('COUNT(orden.id)', 'conteo_ordenes')
      .where('orden.estado IN (:...estados)', { estados: estadosAprobados })
      .getRawOne();

    const totalVentasCop = Number(consultaVentas?.total_ventas || 0);
    const conteoOrdenesAprobadas = Number(consultaVentas?.conteo_ordenes || 0);

    // 2. Conteo de órdenes por cada estado
    const conteoPorEstadoRaw = await this.repositorioOrden
      .createQueryBuilder('orden')
      .select('orden.estado', 'estado')
      .addSelect('COUNT(orden.id)', 'conteo')
      .groupBy('orden.estado')
      .getRawMany();

    const ordenesPorEstado: Record<string, number> = {
      PENDIENTE_PAGO: 0,
      PAGADO: 0,
      CONFIRMADO_CONTRAENTREGA: 0,
      EN_CAMINO: 0,
      ENTREGADO: 0,
      CANCELADO: 0,
    };

    conteoPorEstadoRaw.forEach((row) => {
      ordenesPorEstado[row.estado] = Number(row.conteo);
    });

    const ordenesTotales = Object.values(ordenesPorEstado).reduce((a, b) => a + b, 0);

    // 3. Ticket Promedio
    const ticketPromedioCop =
      conteoOrdenesAprobadas > 0 ? Math.round(totalVentasCop / conteoOrdenesAprobadas) : 0;

    // 4. Métricas de Inventario
    const totalProductos = await this.repositorioProducto.count();
    const productosActivos = await this.repositorioProducto.count({ where: { esta_activo: true } });

    const productosStockBajoRaw = await this.repositorioProducto
      .createQueryBuilder('producto')
      .where('producto.inventario_stock <= producto.alerta_stock_minimo')
      .getMany();

    const valorInventarioRaw = await this.repositorioProducto
      .createQueryBuilder('producto')
      .select('SUM(producto.precio_base * producto.inventario_stock)', 'valor_total')
      .getRawOne();

    const valorTotalInventarioCop = Number(valorInventarioRaw?.valor_total || 0);

    // 5. Métricas de Usuarios / Clientes B2B
    const totalUsuarios = await this.repositorioUsuario.count();
    const clientesFinales = await this.repositorioUsuario.count({
      where: { rol: RolUsuario.CLIENTE_FINAL },
    });
    const tecnicos = await this.repositorioUsuario.count({
      where: { rol: RolUsuario.TECNICO },
    });
    const distribuidores = await this.repositorioUsuario.count({
      where: { rol: RolUsuario.DISTRIBUIDOR },
    });

    return {
      ventas_totales_cop: totalVentasCop,
      ordenes_totales: ordenesTotales,
      ordenes_aprobadas_conteo: conteoOrdenesAprobadas,
      ticket_promedio_cop: ticketPromedioCop,
      ordenes_por_estado: ordenesPorEstado,
      inventario: {
        total_productos: totalProductos,
        productos_activos: productosActivos,
        productos_stock_bajo_conteo: productosStockBajoRaw.length,
        valor_total_inventario_cop: valorTotalInventarioCop,
      },
      clientes: {
        total_registrados: totalUsuarios,
        clientes_finales: clientesFinales,
        tecnicos_profesionales: tecnicos,
        distribuidores_mayoristas: distribuidores,
      },
    };
  }

  /**
   * Obtiene la serie de tiempo de ventas por período (para gráficas en React)
   */
  async obtenerVentasPorPeriodo(dto: FiltrarEstadisticasDto) {
    const { rango = 'mes' } = dto;
    const estadosAprobados = [
      EstadoOrden.PAGADO,
      EstadoOrden.EN_CAMINO,
      EstadoOrden.ENTREGADO,
      EstadoOrden.CONFIRMADO_CONTRAENTREGA,
    ];

    const consulta = this.repositorioOrden
      .createQueryBuilder('orden')
      .select("TO_CHAR(orden.creado_en, 'YYYY-MM-DD')", 'fecha')
      .addSelect('SUM(orden.total)', 'total_ventas')
      .addSelect('COUNT(orden.id)', 'ordenes')
      .where('orden.estado IN (:...estados)', { estados: estadosAprobados });

    // Filtrar fechas según rango
    const ahora = new Date();
    if (rango === 'hoy') {
      const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      consulta.andWhere('orden.creado_en >= :inicioHoy', { inicioHoy });
    } else if (rango === 'semana') {
      const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      consulta.andWhere('orden.creado_en >= :hace7Dias', { hace7Dias });
    } else if (rango === 'mes') {
      const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
      consulta.andWhere('orden.creado_en >= :hace30Dias', { hace30Dias });
    }

    consulta.groupBy("TO_CHAR(orden.creado_en, 'YYYY-MM-DD')").orderBy('fecha', 'ASC');

    const serieTiempoRaw = await consulta.getRawMany();

    return {
      rango,
      serie_tiempo: serieTiempoRaw.map((row) => ({
        fecha: row.fecha,
        total_ventas: Number(row.total_ventas),
        ordenes: Number(row.ordenes),
      })),
    };
  }

  /**
   * Obtiene el listado de productos con bajo inventario para alertas administrativas
   */
  async obtenerAlertasStock() {
    return await this.repositorioProducto
      .createQueryBuilder('producto')
      .where('producto.inventario_stock <= producto.alerta_stock_minimo')
      .orderBy('producto.inventario_stock', 'ASC')
      .getMany();
  }

  /**
   * Registra una visita a la tienda para el cálculo de conversión
   */
  async registrarVisita(ip: string, pagina: string, userAgent: string) {
    const visita = this.repositorioVisita.create({
      ip_visitante: ip,
      pagina_visitada: pagina,
      user_agent: userAgent,
    });
    return await this.repositorioVisita.save(visita);
  }

  /**
   * Obtiene la métrica de tasa de conversión de visitantes a compradores
   */
  async obtenerMetricasConversion() {
    const totalVisitas = await this.repositorioVisita.count();
    const ordenesPagadas = await this.repositorioOrden.count({
      where: [
        { estado: EstadoOrden.PAGADO },
        { estado: EstadoOrden.EN_CAMINO },
        { estado: EstadoOrden.ENTREGADO },
      ],
    });

    const tasaConversion = totalVisitas > 0 ? Number(((ordenesPagadas / totalVisitas) * 100).toFixed(2)) : 0;

    return {
      total_visitas_registradas: totalVisitas,
      ordenes_completadas: ordenesPagadas,
      tasa_conversion_porcentaje: tasaConversion,
    };
  }
}
