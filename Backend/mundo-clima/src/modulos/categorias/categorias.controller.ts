import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { Categoria } from './entidades/categoria.entity';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';
import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto';
import { ActualizarEstadoCategoriaDto } from './dto/actualizar-estado-categoria.dto';
import { JwtAuthGuard } from '../../comun/guards/jwt-auth.guard';
import { RolesGuard } from '../../comun/guards/roles.guard';
import { Roles } from '../../comun/decoradores/roles.decorador';
import { RolUsuario } from '../../comun/enums/hvac.enums';

@Controller('categorias')
export class CategoriasController {
  constructor(private readonly servicioCategorias: CategoriasService) {}

  /**
   * Obtener árbol de categorías o listado plano (Público)
   */
  @Get()
  async obtenerCategorias(@Query('plano') plano?: string): Promise<Categoria[]> {
    if (plano === 'true') {
      return this.servicioCategorias.obtenerTodasPlano();
    }
    return this.servicioCategorias.obtenerArbolCategorias();
  }

  /**
   * Obtener todas las categorías para el panel de administración con estadísticas (Exclusivo Administradores)
   */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async obtenerTodasAdmin(): Promise<any[]> {
    return this.servicioCategorias.obtenerTodasAdmin();
  }

  /**
   * Obtener una categoría por su ID único para administración (Exclusivo Administradores)
   */
  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async obtenerPorIdAdmin(@Param('id', ParseUUIDPipe) id: string): Promise<Categoria> {
    return this.servicioCategorias.buscarPorId(id);
  }

  /**
   * Obtener categoría por slug (Público)
   */
  @Get(':slug')
  async obtenerCategoriaPorSlug(@Param('slug') slug: string): Promise<Categoria> {
    return this.servicioCategorias.obtenerPorSlug(slug);
  }

  /**
   * Crear una nueva categoría (Exclusivo Administradores)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async crear(@Body() crearCategoriaDto: CrearCategoriaDto): Promise<Categoria> {
    return this.servicioCategorias.crear(crearCategoriaDto);
  }

  /**
   * Actualizar una categoría existente (Exclusivo Administradores)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() actualizarCategoriaDto: ActualizarCategoriaDto,
  ): Promise<Categoria> {
    return this.servicioCategorias.actualizar(id, actualizarCategoriaDto);
  }

  /**
   * Activar o desactivar una categoría (Exclusivo Administradores)
   */
  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async actualizarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarEstadoCategoriaDto,
  ): Promise<Categoria> {
    return this.servicioCategorias.actualizarEstado(id, dto.esta_activo);
  }

  /**
   * Eliminar una categoría (Exclusivo Administradores)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicioCategorias.eliminar(id);
  }
}
