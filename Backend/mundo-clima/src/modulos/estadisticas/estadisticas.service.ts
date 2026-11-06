import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Orden } from '../ordenes/entidades/orden.entity';
import { ItemOrden } from '../ordenes/entidades/item-orden.entity';
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
    @InjectRepository(ItemOrden)
    private readonly repositorioItemOrden: Repository<ItemOrden>,
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
      .select('COALESCE(SUM(orden.total), 0)', 'total_ventas')
      .addSelect('COUNT(orden.id)', 'conteo_ordenes')
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
    const { rango = 'mes', desde, hasta } = dto;
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
    } else if (rango === 'semana' || rango === 'ultimos_7_dias' || rango === 'ultimos-7-dias') {
      const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      consulta.andWhere('orden.creado_en >= :hace7Dias', { hace7Dias });
    } else if (rango === 'mes' || rango === 'ultimos_30_dias' || rango === 'ultimos-30-dias') {
      const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
      consulta.andWhere('orden.creado_en >= :hace30Dias', { hace30Dias });
    } else if (rango === 'ano' || rango === 'este_ano' || rango === 'este-ano' || rango === 'ano_actual') {
      // Filtrar el año calendario actual (desde el 1 de enero)
      const inicioAno = new Date(ahora.getFullYear(), 0, 1);
      consulta.andWhere('orden.creado_en >= :inicioAno', { inicioAno });
    }

    // Si se especifican fechas explícitas (rango personalizado o parámetros adicionales)
    if (desde) {
      consulta.andWhere('orden.creado_en >= :desde', { desde });
    }
    if (hasta) {
      const hastaFecha = hasta.includes('T') ? hasta : `${hasta}T23:59:59.999Z`;
      consulta.andWhere('orden.creado_en <= :hasta', { hasta: hastaFecha });
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
   * Obtiene los productos más vendidos en el sistema
   */
  async obtenerTopProductos(limite = 5) {
    const raw = await this.repositorioItemOrden
      .createQueryBuilder('item')
      .leftJoin('item.orden', 'orden')
      .select('item.producto_id', 'producto_id')
      .addSelect('item.nombre_producto', 'nombre_producto')
      .addSelect('SUM(item.cantidad)', 'total_unidades')
      .addSelect('SUM(item.cantidad * item.precio_unitario)', 'total_recaudado')
      .where('orden.estado != :cancelado', { cancelado: EstadoOrden.CANCELADO })
      .groupBy('item.producto_id')
      .addGroupBy('item.nombre_producto')
      .orderBy('total_recaudado', 'DESC')
      .limit(limite)
      .getRawMany();

    return raw.map((r) => ({
      producto_id: r.producto_id,
      nombre_producto: r.nombre_producto,
      total_unidades: Number(r.total_unidades || 0),
      total_recaudado: Number(r.total_recaudado || 0),
    }));
  }

  /**
   * Obtiene los clientes con mayor volumen de compras acumuladas
   */
  async obtenerTopClientes(limite = 5) {
    const raw = await this.repositorioOrden
      .createQueryBuilder('orden')
      .innerJoin('orden.usuario', 'usuario')
      .select('usuario.id', 'id')
      .addSelect('usuario.nombre_completo', 'nombre')
      .addSelect('usuario.email', 'email')
      .addSelect('usuario.rol', 'rol')
      .addSelect('COUNT(orden.id)', 'total_pedidos')
      .addSelect('SUM(orden.total)', 'total_gastado')
      .where('orden.estado != :cancelado', { cancelado: EstadoOrden.CANCELADO })
      .groupBy('usuario.id')
      .addGroupBy('usuario.nombre_completo')
      .addGroupBy('usuario.email')
      .addGroupBy('usuario.rol')
      .orderBy('total_gastado', 'DESC')
      .limit(limite)
      .getRawMany();

    return raw.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      email: r.email,
      rol: r.rol,
      total_pedidos: Number(r.total_pedidos || 0),
      total_gastado: Number(r.total_gastado || 0),
    }));
  }

  /**
   * Obtiene la línea de tiempo de actividad reciente para el panel de administración
   */
  async obtenerActividadReciente() {
    const ultimasOrdenes = await this.repositorioOrden.find({
      relations: { usuario: true },
      order: { creado_en: 'DESC' },
      take: 5,
    });

    const ultimosUsuarios = await this.repositorioUsuario.find({
      order: { creado_en: 'DESC' },
      take: 5,
    });

    const alertasStock = await this.repositorioProducto
      .createQueryBuilder('producto')
      .where('producto.inventario_stock <= producto.alerta_stock_minimo')
      .orderBy('producto.inventario_stock', 'ASC')
      .take(5)
      .getMany();

    return {
      ultimas_ordenes: ultimasOrdenes.map((o) => ({
        id: o.id,
        referencia: o.referencia,
        cliente: o.usuario?.nombre_completo || 'Cliente',
        total: o.total,
        estado: o.estado,
        fecha: o.creado_en,
      })),
      ultimos_usuarios: ultimosUsuarios.map((u) => ({
        id: u.id,
        nombre: u.nombre_completo,
        email: u.email,
        rol: u.rol,
        fecha: u.creado_en,
      })),
      alertas_stock: alertasStock.map((p) => ({
        id: p.id,
        sku: p.sku,
        nombre: p.nombre,
        inventario_stock: p.inventario_stock,
        alerta_stock_minimo: p.alerta_stock_minimo,
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
