import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MarcasService } from './marcas.service';
import { Marca } from './entidades/marca.entity';
import { CrearMarcaDto } from './dto/crear-marca.dto';
import { ActualizarMarcaDto } from './dto/actualizar-marca.dto';
import { ActualizarEstadoMarcaDto } from './dto/actualizar-estado-marca.dto';
import { JwtAuthGuard } from '../../comun/guards/jwt-auth.guard';
import { RolesGuard } from '../../comun/guards/roles.guard';
import { Roles } from '../../comun/decoradores/roles.decorador';
import { RolUsuario } from '../../comun/enums/hvac.enums';

@Controller('marcas')
export class MarcasController {
  constructor(private readonly servicioMarcas: MarcasService) {}

  /**
   * Obtener todas las marcas activas (Público)
   */
  @Get()
  async obtenerMarcas(): Promise<Marca[]> {
    return this.servicioMarcas.obtenerTodas();
  }

  /**
   * Obtener todas las marcas con conteo de productos para administración (Exclusivo Administradores)
   */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async obtenerTodasAdmin(): Promise<any[]> {
    return this.servicioMarcas.obtenerTodasAdmin();
  }

  /**
   * Obtener una marca por su ID único para administración (Exclusivo Administradores)
   */
  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async obtenerPorIdAdmin(@Param('id', ParseUUIDPipe) id: string): Promise<Marca> {
    return this.servicioMarcas.buscarPorId(id);
  }

  /**
   * Obtener marca por slug (Público)
   */
  @Get(':slug')
  async obtenerMarcaPorSlug(@Param('slug') slug: string): Promise<Marca> {
    return this.servicioMarcas.obtenerPorSlug(slug);
  }

  /**
   * Crear una nueva marca (Exclusivo Administradores)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async crear(@Body() crearMarcaDto: CrearMarcaDto): Promise<Marca> {
    return this.servicioMarcas.crear(crearMarcaDto);
  }

  /**
   * Actualizar una marca existente (Exclusivo Administradores)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() actualizarMarcaDto: ActualizarMarcaDto,
  ): Promise<Marca> {
    return this.servicioMarcas.actualizar(id, actualizarMarcaDto);
  }

  /**
   * Activar o desactivar una marca (Exclusivo Administradores)
   */
  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async actualizarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarEstadoMarcaDto,
  ): Promise<Marca> {
    return this.servicioMarcas.actualizarEstado(id, dto.esta_activo);
  }

  /**
   * Eliminar una marca (Exclusivo Administradores)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicioMarcas.eliminar(id);
  }
}
