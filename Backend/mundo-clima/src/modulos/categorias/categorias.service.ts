import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Categoria } from './entidades/categoria.entity';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly repositorioCategoria: Repository<Categoria>,
  ) {}

  /**
   * Obtiene el árbol completo de categorías jerárquicas (Categoría Padre > Subcategorías)
   */
  async obtenerArbolCategorias(): Promise<Categoria[]> {
    return this.repositorioCategoria.find({
      where: { categoria_padre_id: IsNull(), esta_activo: true },
      relations: { hijos: { hijos: true } },
      order: { nombre: 'ASC' },
    });
  }

  /**
   * Obtiene la lista plana de todas las categorías activas
   */
  async obtenerTodasPlano(): Promise<Categoria[]> {
    return this.repositorioCategoria.find({
      where: { esta_activo: true },
      order: { nombre: 'ASC' },
    });
  }

  /**
   * Busca una categoría por su slug único
   */
  async obtenerPorSlug(slug: string): Promise<Categoria> {
    const categoria = await this.repositorioCategoria.findOne({
      where: { slug, esta_activo: true },
      relations: { hijos: true, padre: true },
    });

    if (!categoria) {
      throw new NotFoundException(`La categoría con el slug '${slug}' no fue encontrada`);
    }

    return categoria;
  }
}
