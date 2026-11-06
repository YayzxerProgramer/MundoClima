import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ProductosService,
  ResultadoProductosPaginados,
  ResultadoProductosAdminPaginados,
} from './productos.service';
import { FiltrarProductosDto } from './dto/filtrar-productos.dto';
import { FiltrarProductosAdminDto } from './dto/filtrar-productos-admin.dto';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto';
import { ActualizarStockDto } from './dto/actualizar-stock.dto';
import { ActualizarEstadoProductoDto } from './dto/actualizar-estado-producto.dto';
import { NivelCliente, RolUsuario } from '../../comun/enums/hvac.enums';
import { JwtOpcionalGuard } from '../../comun/guards/jwt-opcional.guard';
import { JwtAuthGuard } from '../../comun/guards/jwt-auth.guard';
import { RolesGuard } from '../../comun/guards/roles.guard';
import { Roles } from '../../comun/decoradores/roles.decorador';
import { ObtenerUsuario } from '../../comun/decoradores/obtener-usuario.decorador';
import { Usuario } from '../usuarios/entidades/usuario.entity';

/**
 * Controlador del catálogo de productos HVAC/R con soporte para precios dinámicos B2B y administración completa
 */
@Controller('productos')
export class ProductosController {
  constructor(private readonly servicioProductos: ProductosService) {}

  /**
   * Obtener lista paginada de productos para la tienda pública con facetas y precios B2B
   */
  @Get()
  @UseGuards(JwtOpcionalGuard)
  async obtenerProductos(
    @Query() filtroDto: FiltrarProductosDto,
    @Headers('x-nivel-cliente') encabezadoNivel?: NivelCliente,
    @ObtenerUsuario() usuarioAutenticado?: Usuario,
  ): Promise<ResultadoProductosPaginados> {
    if (!filtroDto.nivelCliente) {
      if (usuarioAutenticado?.rol) {
        filtroDto.nivelCliente = usuarioAutenticado.rol;
      } else if (encabezadoNivel) {
        filtroDto.nivelCliente = encabezadoNivel;
      }
    }

    return this.servicioProductos.obtenerTodos(filtroDto);
  }

  /**
   * Obtener lista paginada de productos para el panel de administración (Exclusivo Administradores)
   */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async obtenerProductosAdmin(
    @Query() filtroDto: FiltrarProductosAdminDto,
  ): Promise<ResultadoProductosAdminPaginados> {
    return this.servicioProductos.obtenerTodosAdmin(filtroDto);
  }

  /**
   * Obtener producto específico por ID para el panel de administración (Exclusivo Administradores)
   */
  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async obtenerProductoAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicioProductos.obtenerPorIdAdmin(id);
  }

  /**
   * Obtener las opciones de filtros disponibles para la tienda (categorías, marcas, voltajes, refrigerantes)
   */
  @Get('filtros')
  async obtenerOpcionesFiltros(): Promise<any> {
    return this.servicioProductos.obtenerOpcionesFiltros();
  }

  /**
   * Obtener un producto por ID o slug con el cálculo de su precio final según el rol B2B (Público)
   */
  @Get(':identificador')
  @UseGuards(JwtOpcionalGuard)
  async obtenerProducto(
    @Param('identificador') identificador: string,
    @Query('nivel') consultaNivel?: NivelCliente,
    @Headers('x-nivel-cliente') encabezadoNivel?: NivelCliente,
    @ObtenerUsuario() usuarioAutenticado?: Usuario,
  ): Promise<any> {
    const nivel =
      consultaNivel ||
      usuarioAutenticado?.rol ||
      encabezadoNivel ||
      NivelCliente.CLIENTE_FINAL;

    return this.servicioProductos.obtenerPorSlugOId(identificador, nivel);
  }

  /**
   * Crear un nuevo producto en el catálogo (Exclusivo Administradores)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async crearProducto(@Body() crearProductoDto: CrearProductoDto) {
    return this.servicioProductos.crear(crearProductoDto);
  }

  /**
   * Actualizar un producto existente (Exclusivo Administradores)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async actualizarProducto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() actualizarProductoDto: ActualizarProductoDto,
  ) {
    return this.servicioProductos.actualizar(id, actualizarProductoDto);
  }

  /**
   * Actualizar rápidamente el inventario de un producto (Exclusivo Administradores)
   */
  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async actualizarStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarStockDto,
  ) {
    return this.servicioProductos.actualizarStock(id, dto);
  }

  /**
   * Activar o desactivar un producto (Exclusivo Administradores)
   */
  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async actualizarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarEstadoProductoDto,
  ) {
    return this.servicioProductos.actualizarEstado(id, dto.esta_activo);
  }

  /**
   * Eliminar o desactivar un producto del catálogo (Exclusivo Administradores)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async eliminarProducto(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicioProductos.eliminar(id);
  }
}
