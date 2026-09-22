import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';
import { JwtAuthGuard } from '../../comun/guards/jwt-auth.guard';
import { RolesGuard } from '../../comun/guards/roles.guard';
import { Roles } from '../../comun/decoradores/roles.decorador';
import { RolUsuario } from '../../comun/enums/hvac.enums';

/**
 * Controlador de gestión de usuarios (exclusivo para administradores)
 */
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @Roles(RolUsuario.ADMIN)
  crear(@Body() crearUsuarioDto: CrearUsuarioDto) {
    return this.usuariosService.crear(crearUsuarioDto);
  }

  @Get()
  @Roles(RolUsuario.ADMIN)
  obtenerTodos() {
    return this.usuariosService.obtenerTodos();
  }

  @Get(':id')
  @Roles(RolUsuario.ADMIN)
  obtenerPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.buscarPorId(id);
  }

  @Patch(':id')
  @Roles(RolUsuario.ADMIN)
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() actualizarUsuarioDto: ActualizarUsuarioDto,
  ) {
    return this.usuariosService.actualizar(id, actualizarUsuarioDto);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.eliminar(id);
  }
}
