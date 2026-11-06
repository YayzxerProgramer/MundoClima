import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Marca } from './entidades/marca.entity';
import { CrearMarcaDto } from './dto/crear-marca.dto';
import { ActualizarMarcaDto } from './dto/actualizar-marca.dto';
import { generarSlug } from '../../comun/utilidades/slug.util';

@Injectable()
export class MarcasService {
  constructor(
    @InjectRepository(Marca)
    private readonly repositorioMarca: Repository<Marca>,
  ) {}

  /**
   * Obtiene todas las marcas activas (Público)
   */
  async obtenerTodas(): Promise<Marca[]> {
    return this.repositorioMarca.find({
      where: { esta_activo: true },
      order: { nombre: 'ASC' },
    });
  }

  /**
   * Obtiene todas las marcas para el panel de administración con conteo de productos
   */
  async obtenerTodasAdmin(): Promise<any[]> {
    const marcas = await this.repositorioMarca.find({
      order: { nombre: 'ASC' },
    });

    const conteos = await this.repositorioMarca
      .createQueryBuilder('marca')
      .leftJoin('marca.productos', 'producto')
      .select('marca.id', 'id')
      .addSelect('COUNT(producto.id)', 'total_productos')
      .groupBy('marca.id')
      .getRawMany();

    const mapaConteos = new Map(
      conteos.map((c) => [c.id, Number(c.total_productos || 0)]),
    );

    return marcas.map((m) => ({
      ...m,
      total_productos: mapaConteos.get(m.id) || 0,
    }));
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

  /**
   * Busca una marca por su ID único (UUID)
   */
  async buscarPorId(id: string): Promise<Marca> {
    const marca = await this.repositorioMarca.findOne({ where: { id } });

    if (!marca) {
      throw new NotFoundException(`La marca con ID '${id}' no fue encontrada`);
    }

    return marca;
  }

  /**
   * Crea una nueva marca desde el panel de administración
   */
  async crear(crearMarcaDto: CrearMarcaDto): Promise<Marca> {
    const slugBase = crearMarcaDto.slug
      ? generarSlug(crearMarcaDto.slug)
      : generarSlug(crearMarcaDto.nombre);

    let slugFinal = slugBase;
    let contador = 1;
    while (await this.repositorioMarca.findOne({ where: { slug: slugFinal } })) {
      slugFinal = `${slugBase}-${contador++}`;
    }

    const nuevaMarca = this.repositorioMarca.create({
      ...crearMarcaDto,
      slug: slugFinal,
    });

    return await this.repositorioMarca.save(nuevaMarca);
  }

  /**
   * Actualiza una marca existente
   */
  async actualizar(id: string, actualizarMarcaDto: ActualizarMarcaDto): Promise<Marca> {
    const marca = await this.buscarPorId(id);

    if (actualizarMarcaDto.slug || actualizarMarcaDto.nombre) {
      const nuevoSlug = actualizarMarcaDto.slug
        ? generarSlug(actualizarMarcaDto.slug)
        : generarSlug(actualizarMarcaDto.nombre!);

      if (nuevoSlug !== marca.slug) {
        const existente = await this.repositorioMarca.findOne({
          where: { slug: nuevoSlug },
        });
        if (existente && existente.id !== id) {
          throw new ConflictException(`El slug '${nuevoSlug}' ya está en uso por otra marca`);
        }
        marca.slug = nuevoSlug;
      }
    }

    Object.assign(marca, actualizarMarcaDto);
    return await this.repositorioMarca.save(marca);
  }

  /**
   * Cambia el estado de activación de una marca
   */
  async actualizarEstado(id: string, esta_activo: boolean): Promise<Marca> {
    const marca = await this.buscarPorId(id);
    marca.esta_activo = esta_activo;
    return await this.repositorioMarca.save(marca);
  }

  /**
   * Elimina una marca o realiza borrado lógico si tiene productos asociados
   */
  async eliminar(id: string): Promise<{ mensaje: string; borrado_logico?: boolean }> {
    const marca = await this.repositorioMarca.findOne({
      where: { id },
      relations: { productos: true },
    });

    if (!marca) {
      throw new NotFoundException(`La marca con ID '${id}' no existe`);
    }

    if (marca.productos && marca.productos.length > 0) {
      marca.esta_activo = false;
      await this.repositorioMarca.save(marca);
      return {
        mensaje: `La marca '${marca.nombre}' fue desactivada porque tiene productos asociados`,
        borrado_logico: true,
      };
    }

    await this.repositorioMarca.remove(marca);
    return {
      mensaje: `La marca '${marca.nombre}' fue eliminada permanentemente del sistema`,
      borrado_logico: false,
    };
  }
}
