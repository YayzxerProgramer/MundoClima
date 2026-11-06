import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { ActualizarEstadoUsuarioDto } from './dto/actualizar-estado-usuario.dto';
import { ActualizarRolUsuarioDto } from './dto/actualizar-rol-usuario.dto';
import { FiltrarUsuariosDto } from './dto/filtrar-usuarios.dto';
import { JwtAuthGuard } from '../../comun/guards/jwt-auth.guard';
import { RolesGuard } from '../../comun/guards/roles.guard';
import { Roles } from '../../comun/decoradores/roles.decorador';
import { RolUsuario } from '../../comun/enums/hvac.enums';

/**
 * Controlador de gestión de usuarios (exclusivo para administradores)
 */
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMIN)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /**
   * Crear un nuevo usuario en la plataforma (Exclusivo Administradores)
   */
  @Post()
  crear(@Body() crearUsuarioDto: CrearUsuarioDto) {
    return this.usuariosService.crear(crearUsuarioDto);
  }

  /**
   * Obtener listado de usuarios con filtros y búsqueda (Exclusivo Administradores)
   */
  @Get()
  obtenerTodos(@Query() filtroDto: FiltrarUsuariosDto) {
    return this.usuariosService.obtenerTodos(filtroDto);
  }

  /**
   * Obtener detalle de un usuario por su ID (Exclusivo Administradores)
   */
  @Get(':id')
  obtenerPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.buscarPorId(id);
  }

  /**
   * Actualizar datos de un usuario (Exclusivo Administradores)
   */
  @Patch(':id')
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() actualizarUsuarioDto: ActualizarUsuarioDto,
  ) {
    return this.usuariosService.actualizar(id, actualizarUsuarioDto);
  }

  /**
   * Activar o desactivar un usuario (Exclusivo Administradores)
   */
  @Patch(':id/estado')
  actualizarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarEstadoUsuarioDto,
  ) {
    return this.usuariosService.actualizarEstado(id, dto.esta_activo);
  }

  /**
   * Cambiar el rol de un usuario (Exclusivo Administradores)
   */
  @Patch(':id/rol')
  actualizarRol(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarRolUsuarioDto,
  ) {
    return this.usuariosService.actualizarRol(id, dto.rol);
  }

  /**
   * Eliminar un usuario del sistema (Exclusivo Administradores)
   */
  @Delete(':id')
  eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.eliminar(id);
  }
}
