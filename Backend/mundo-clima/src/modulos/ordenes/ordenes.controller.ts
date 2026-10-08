import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OrdenesService } from './ordenes.service';
import { CrearOrdenDto } from './dto/crear-orden.dto';
import { FiltrarOrdenesDto } from './dto/filtrar-ordenes.dto';
import { JwtAuthGuard } from '../../comun/guards/jwt-auth.guard';
import { RolesGuard } from '../../comun/guards/roles.guard';
import { Roles } from '../../comun/decoradores/roles.decorador';
import { ObtenerUsuario } from '../../comun/decoradores/obtener-usuario.decorador';
import { RolUsuario } from '../../comun/enums/hvac.enums';
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
}
