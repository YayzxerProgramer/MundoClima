import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Marca } from './entidades/marca.entity';

@Injectable()
export class MarcasService {
  constructor(
    @InjectRepository(Marca)
    private readonly repositorioMarca: Repository<Marca>,
  ) {}

  /**
   * Obtiene todas las marcas activas
   */
  async obtenerTodas(): Promise<Marca[]> {
    return this.repositorioMarca.find({
      where: { esta_activo: true },
      order: { nombre: 'ASC' },
    });
  }

  /**
   * Busca una marca por su slug único
   */
  async obtenerPorSlug(slug: string): Promise<Marca> {
    const marca = await this.repositorioMarca.findOne({
      where: { slug, esta_activo: true },
    });

    if (!marca) {
      throw new NotFoundException(`La marca con el slug '${slug}' no fue encontrada`);
    }

    return marca;
  }
}
