import { Controller, Get, Param } from '@nestjs/common';
import { MarcasService } from './marcas.service';
import { Marca } from './entidades/marca.entity';

@Controller('marcas')
export class MarcasController {
  constructor(private readonly servicioMarcas: MarcasService) {}

  @Get()
  async obtenerMarcas(): Promise<Marca[]> {
    return this.servicioMarcas.obtenerTodas();
  }

  @Get(':slug')
  async obtenerMarcaPorSlug(@Param('slug') slug: string): Promise<Marca> {
    return this.servicioMarcas.obtenerPorSlug(slug);
  }
}
