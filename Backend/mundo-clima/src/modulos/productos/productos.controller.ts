import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ProductosService,
  ResultadoProductosPaginados,
} from './productos.service';
import { FiltrarProductosDto } from './dto/filtrar-productos.dto';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { NivelCliente, RolUsuario } from '../../comun/enums/hvac.enums';
import { JwtOpcionalGuard } from '../../comun/guards/jwt-opcional.guard';
import { JwtAuthGuard } from '../../comun/guards/jwt-auth.guard';
import { RolesGuard } from '../../comun/guards/roles.guard';
import { Roles } from '../../comun/decoradores/roles.decorador';
import { ObtenerUsuario } from '../../comun/decoradores/obtener-usuario.decorador';
import { Usuario } from '../usuarios/entidades/usuario.entity';

/**
 * Controlador del catálogo de productos HVAC/R con soporte para precios dinámicos B2B y RBAC
 */
@Controller('productos')
export class ProductosController {
  constructor(private readonly servicioProductos: ProductosService) {}

  /**
   * Obtener lista paginada de productos con filtros de categoría, marca, precio, voltaje, etc.
   * Aplica automáticamente el nivel de descuento según el rol del usuario en el token JWT (si se proporciona)
   */
  @Get()
  @UseGuards(JwtOpcionalGuard)
  async obtenerProductos(
    @Query() filtroDto: FiltrarProductosDto,
    @Headers('x-nivel-cliente') encabezadoNivel?: NivelCliente,
    @ObtenerUsuario() usuarioAutenticado?: Usuario,
  ): Promise<ResultadoProductosPaginados> {
    // Determinar el nivel de cliente B2B prioritariamente por:
    // 1. Parámetro query implícito en DTO
    // 2. Rol del usuario autenticado en JWT
    // 3. Encabezado 'x-nivel-cliente'
    // 4. Default CLIENTE_FINAL
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
   * Obtener las opciones de filtros disponibles para la tienda (categorías, marcas, voltajes, refrigerantes)
   */
  @Get('filtros')
  async obtenerOpcionesFiltros(): Promise<any> {
    return this.servicioProductos.obtenerOpcionesFiltros();
  }

  /**
   * Obtener un producto por ID o slug con el cálculo de su precio final según el rol B2B
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
}
