import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OrdenesService } from './ordenes.service';
import { CrearOrdenDto } from './dto/crear-orden.dto';
import { FiltrarOrdenesDto } from './dto/filtrar-ordenes.dto';
import { ActualizarEstadoOrdenDto } from './dto/actualizar-estado-orden.dto';
import { AsignarGuiaOrdenDto } from './dto/asignar-guia-orden.dto';
import { JwtAuthGuard } from '../../comun/guards/jwt-auth.guard';
import { RolesGuard } from '../../comun/guards/roles.guard';
import { Roles } from '../../comun/decoradores/roles.decorador';
import { ObtenerUsuario } from '../../comun/decoradores/obtener-usuario.decorador';
import { EstadoOrden, RolUsuario } from '../../comun/enums/hvac.enums';
import { Usuario } from '../usuarios/entidades/usuario.entity';

/**
 * Controlador para la gestión de órdenes de compra, consulta de pedidos y administración
 */
@Controller('ordenes')
export class OrdenesController {
  constructor(private readonly ordenesService: OrdenesService) {}

  /**
   * Crear una nueva orden de compra a partir del carrito de compras (Login obligatorio)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async crear(
    @Body() crearOrdenDto: CrearOrdenDto,
    @ObtenerUsuario() usuario: Usuario,
  ) {
    return this.ordenesService.crear(crearOrdenDto, usuario);
  }

  /**
   * Obtener el historial de pedidos del usuario autenticado
   */
  @Get('mis-pedidos')
  @UseGuards(JwtAuthGuard)
  async obtenerMisPedidos(@ObtenerUsuario('id') usuarioId: string) {
    return this.ordenesService.obtenerMisPedidos(usuarioId);
  }

  /**
   * Obtener todas las órdenes de la plataforma con filtrado y paginación (Exclusivo Administradores)
   */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async obtenerTodasAdmin(@Query() filtroDto: FiltrarOrdenesDto) {
    return this.ordenesService.obtenerTodasAdmin(filtroDto);
  }

  /**
   * Obtener los detalles de una orden específica por ID (Validación de propiedad o Admin)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async obtenerPorId(
    @Param('id', ParseUUIDPipe) id: string,
    @ObtenerUsuario() usuario: Usuario,
  ) {
    return this.ordenesService.obtenerPorId(id, usuario);
  }

  /**
   * Actualizar el estado de una orden (Exclusivo Administradores)
   * Si se cancela, se restituye automáticamente el stock
   */
  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async actualizarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarEstadoOrdenDto,
  ) {
    return this.ordenesService.actualizarEstado(id, dto);
  }

  /**
   * Generar guía de despacho oficial con Coordinadora Mercantil y pasar a EN_CAMINO (Exclusivo Administradores)
   */
  @Post(':id/despachar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async despacharOrden(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordenesService.despacharOrden(id);
  }

  /**
   * Asignar o actualizar manualmente el número de guía de transporte (Exclusivo Administradores)
   */
  @Patch(':id/guia')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async asignarGuia(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AsignarGuiaOrdenDto,
  ) {
    return this.ordenesService.asignarGuiaManual(id, dto);
  }

  /**
   * Cancelar una orden de compra y devolver existencias al inventario (Exclusivo Administradores)
   */
  @Patch(':id/cancelar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async cancelarOrden(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('motivo') motivo?: string,
  ) {
    return this.ordenesService.actualizarEstado(id, {
      estado: EstadoOrden.CANCELADO,
      notas: motivo,
    });
  }
}
