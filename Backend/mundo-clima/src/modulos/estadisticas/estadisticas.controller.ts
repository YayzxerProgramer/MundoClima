import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EstadisticasService } from './estadisticas.service';
import { FiltrarEstadisticasDto } from './dto/filtrar-estadisticas.dto';
import { JwtAuthGuard } from '../../comun/guards/jwt-auth.guard';
import { RolesGuard } from '../../comun/guards/roles.guard';
import { Roles } from '../../comun/decoradores/roles.decorador';
import { RolUsuario } from '../../comun/enums/hvac.enums';

/**
 * Controlador REST para el Panel de Analítica y Estadísticas de Administración
 */
@Controller('estadisticas')
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  /**
   * Obtiene el resumen consolidado de KPIs (Ventas, Órdenes, Inventario y Clientes)
   * Acceso exclusivo para administradores
   */
  @Get('resumen')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  obtenerResumenGeneral() {
    return this.estadisticasService.obtenerResumenGeneral();
  }

  /**
   * Obtiene las métricas de ventas agregadas por periodo (para gráficas en React)
   */
  @Get('ventas-periodo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  obtenerVentasPorPeriodo(@Query() dto: FiltrarEstadisticasDto) {
    return this.estadisticasService.obtenerVentasPorPeriodo(dto);
  }

  /**
   * Obtiene la lista de productos con inventario crítico o en punto de reorden
   */
  @Get('alertas-stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  obtenerAlertasStock() {
    return this.estadisticasService.obtenerAlertasStock();
  }

  /**
   * Obtiene el desglose de tasa de conversión (visitas vs compras)
   */
  @Get('conversion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  obtenerMetricasConversion() {
    return this.estadisticasService.obtenerMetricasConversion();
  }

  /**
   * Endpoint público para registrar visitas/impresiones desde el frontend
   */
  @Post('visita')
  @HttpCode(HttpStatus.OK)
  registrarVisita(
    @Req() req: any,
    @Body('pagina') pagina?: string,
  ) {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Navegador Web';
    return this.estadisticasService.registrarVisita(ip, pagina || '/', userAgent);
  }
}
