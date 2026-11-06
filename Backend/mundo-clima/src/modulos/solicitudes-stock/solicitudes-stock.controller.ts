import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SolicitudesStockService } from './solicitudes-stock.service';
import { CrearSolicitudStockDto } from './dto/crear-solicitud-stock.dto';
import { ActualizarSolicitudStockDto } from './dto/actualizar-solicitud-stock.dto';
import { FiltrarSolicitudesStockDto } from './dto/filtrar-solicitudes-stock.dto';
import { JwtOpcionalGuard } from '../../comun/guards/jwt-opcional.guard';
import { JwtAuthGuard } from '../../comun/guards/jwt-auth.guard';
import { RolesGuard } from '../../comun/guards/roles.guard';
import { Roles } from '../../comun/decoradores/roles.decorador';
import { ObtenerUsuario } from '../../comun/decoradores/obtener-usuario.decorador';
import { RolUsuario } from '../../comun/enums/hvac.enums';
import { Usuario } from '../usuarios/entidades/usuario.entity';

/**
 * Controlador para la recepción y gestión de prospectos / solicitudes de productos con stock en 0
 */
@Controller('solicitudes-stock')
export class SolicitudesStockController {
  constructor(
    private readonly solicitudesService: SolicitudesStockService,
  ) {}

  /**
   * Endpoint público para que los clientes dejen sus datos cuando un producto tiene stock en 0
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtOpcionalGuard)
  async crear(
    @Body() dto: CrearSolicitudStockDto,
    @ObtenerUsuario() usuarioAutenticado?: Usuario,
  ) {
    return this.solicitudesService.crear(dto, usuarioAutenticado?.id);
  }

  /**
   * Listar solicitudes de stock para el equipo comercial / administrador (Exclusivo Administradores)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async obtenerTodas(@Query() filtroDto: FiltrarSolicitudesStockDto) {
    return this.solicitudesService.obtenerTodas(filtroDto);
  }

  /**
   * Consultar detalle de una solicitud específica (Exclusivo Administradores)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async obtenerPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.solicitudesService.obtenerPorId(id);
  }

  /**
   * Actualizar estado o notas de seguimiento del asesor (Exclusivo Administradores)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarSolicitudStockDto,
  ) {
    return this.solicitudesService.actualizar(id, dto);
  }

  /**
   * Eliminar una solicitud (Exclusivo Administradores)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.solicitudesService.eliminar(id);
  }
}
