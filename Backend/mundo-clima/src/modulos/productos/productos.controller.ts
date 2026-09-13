import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import { ProductosService, ResultadoProductosPaginados } from './productos.service';
import { FiltrarProductosDto } from './dto/filtrar-productos.dto';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { NivelCliente } from '../../comun/enums/hvac.enums';

@Controller('productos')
export class ProductosController {
  constructor(private readonly servicioProductos: ProductosService) {}

  @Get()
  async obtenerProductos(
    @Query() filtroDto: FiltrarProductosDto,
    @Headers('x-nivel-cliente') encabezadoNivel?: NivelCliente,
  ): Promise<ResultadoProductosPaginados> {
    if (encabezadoNivel && !filtroDto.nivelCliente) {
      filtroDto.nivelCliente = encabezadoNivel;
    }
    return this.servicioProductos.obtenerTodos(filtroDto);
  }

  @Get('filtros')
  async obtenerOpcionesFiltros(): Promise<any> {
    return this.servicioProductos.obtenerOpcionesFiltros();
  }

  @Get(':identificador')
  async obtenerProducto(
    @Param('identificador') identificador: string,
    @Query('nivel') consultaNivel?: NivelCliente,
    @Headers('x-nivel-cliente') encabezadoNivel?: NivelCliente,
  ): Promise<any> {
    const nivel = consultaNivel || encabezadoNivel || NivelCliente.CLIENTE_FINAL;
    return this.servicioProductos.obtenerPorSlugOId(identificador, nivel);
  }

  @Post()
  async crearProducto(@Body() crearProductoDto: CrearProductoDto) {
    return this.servicioProductos.crear(crearProductoDto);
  }
}
