import { Controller, Get, Param, Query } from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { Categoria } from './entidades/categoria.entity';

@Controller('categorias')
export class CategoriasController {
  constructor(private readonly servicioCategorias: CategoriasService) {}

  @Get()
  async obtenerCategorias(@Query('plano') plano?: string): Promise<Categoria[]> {
    if (plano === 'true') {
      return this.servicioCategorias.obtenerTodasPlano();
    }
    return this.servicioCategorias.obtenerArbolCategorias();
  }

  @Get(':slug')
  async obtenerCategoriaPorSlug(@Param('slug') slug: string): Promise<Categoria> {
    return this.servicioCategorias.obtenerPorSlug(slug);
  }
}
