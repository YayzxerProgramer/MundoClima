import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Categoria } from './entidades/categoria.entity';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';
import { ActualizarCategoriaDto } from './dto/actualizar-categoria.dto';
import { generarSlug } from '../../comun/utilidades/slug.util';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly repositorioCategoria: Repository<Categoria>,
  ) {}

  /**
   * Obtiene el árbol completo de categorías jerárquicas activas (Categoría Padre > Subcategorías)
   */
  async obtenerArbolCategorias(): Promise<Categoria[]> {
    return this.repositorioCategoria.find({
      where: { categoria_padre_id: IsNull(), esta_activo: true },
      relations: { hijos: { hijos: true } },
      order: { nombre: 'ASC' },
    });
  }

  /**
   * Obtiene la lista plana de todas las categorías activas (Tienda pública)
   */
  async obtenerTodasPlano(): Promise<Categoria[]> {
    return this.repositorioCategoria.find({
      where: { esta_activo: true },
      order: { nombre: 'ASC' },
    });
  }

  /**
   * Obtiene todas las categorías para el panel de administración (activas e inactivas) con conteo de productos
   */
  async obtenerTodasAdmin(): Promise<any[]> {
    const categorias = await this.repositorioCategoria.find({
      relations: { padre: true, hijos: true },
      order: { nombre: 'ASC' },
    });

    const conteos = await this.repositorioCategoria
      .createQueryBuilder('categoria')
      .leftJoin('categoria.productos', 'producto')
      .select('categoria.id', 'id')
      .addSelect('COUNT(producto.id)', 'total_productos')
      .groupBy('categoria.id')
      .getRawMany();

    const mapaConteos = new Map(
      conteos.map((c) => [c.id, Number(c.total_productos || 0)]),
    );

    return categorias.map((cat) => ({
      ...cat,
      total_productos: mapaConteos.get(cat.id) || 0,
    }));
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

  /**
   * Busca una categoría por su ID único (UUID)
   */
  async buscarPorId(id: string): Promise<Categoria> {
    const categoria = await this.repositorioCategoria.findOne({
      where: { id },
      relations: { hijos: true, padre: true },
    });

    if (!categoria) {
      throw new NotFoundException(`La categoría con ID '${id}' no fue encontrada`);
    }

    return categoria;
  }

  /**
   * Crea una nueva categoría desde el panel de administración
   */
  async crear(crearCategoriaDto: CrearCategoriaDto): Promise<Categoria> {
    const slugBase = crearCategoriaDto.slug
      ? generarSlug(crearCategoriaDto.slug)
      : generarSlug(crearCategoriaDto.nombre);

    // Asegurar unicidad del slug
    let slugFinal = slugBase;
    let contador = 1;
    while (await this.repositorioCategoria.findOne({ where: { slug: slugFinal } })) {
      slugFinal = `${slugBase}-${contador++}`;
    }

    // Validar categoría padre si se proporcionó
    if (crearCategoriaDto.categoria_padre_id) {
      const padre = await this.repositorioCategoria.findOne({
        where: { id: crearCategoriaDto.categoria_padre_id },
      });
      if (!padre) {
        throw new NotFoundException(
          `La categoría padre con ID '${crearCategoriaDto.categoria_padre_id}' no existe`,
        );
      }
    }

    const nuevaCategoria = this.repositorioCategoria.create({
      ...crearCategoriaDto,
      slug: slugFinal,
    });

    return await this.repositorioCategoria.save(nuevaCategoria);
  }

  /**
   * Actualiza una categoría existente
   */
  async actualizar(
    id: string,
    actualizarCategoriaDto: ActualizarCategoriaDto,
  ): Promise<Categoria> {
    const categoria = await this.buscarPorId(id);

    // Prevenir que una categoría sea su propio padre
    if (
      actualizarCategoriaDto.categoria_padre_id &&
      actualizarCategoriaDto.categoria_padre_id === id
    ) {
      throw new BadRequestException('Una categoría no puede ser su propia categoría padre');
    }

    // Validar padre si se envió
    if (actualizarCategoriaDto.categoria_padre_id) {
      const padre = await this.repositorioCategoria.findOne({
        where: { id: actualizarCategoriaDto.categoria_padre_id },
      });
      if (!padre) {
        throw new NotFoundException(
          `La categoría padre con ID '${actualizarCategoriaDto.categoria_padre_id}' no existe`,
        );
      }
    }

    // Si se proporciona un nuevo slug o nuevo nombre, verificar unicidad
    if (actualizarCategoriaDto.slug || actualizarCategoriaDto.nombre) {
      const nuevoSlug = actualizarCategoriaDto.slug
        ? generarSlug(actualizarCategoriaDto.slug)
        : generarSlug(actualizarCategoriaDto.nombre!);

      if (nuevoSlug !== categoria.slug) {
        const existente = await this.repositorioCategoria.findOne({
          where: { slug: nuevoSlug },
        });
        if (existente && existente.id !== id) {
          throw new ConflictException(`El slug '${nuevoSlug}' ya está en uso por otra categoría`);
        }
        categoria.slug = nuevoSlug;
      }
    }

    Object.assign(categoria, actualizarCategoriaDto);
    return await this.repositorioCategoria.save(categoria);
  }

  /**
   * Cambia el estado de activación de una categoría
   */
  async actualizarEstado(id: string, esta_activo: boolean): Promise<Categoria> {
    const categoria = await this.buscarPorId(id);
    categoria.esta_activo = esta_activo;
    return await this.repositorioCategoria.save(categoria);
  }

  /**
   * Elimina una categoría o realiza borrado lógico si tiene dependencias
   */
  async eliminar(id: string): Promise<{ mensaje: string; borrado_logico?: boolean }> {
    const categoria = await this.repositorioCategoria.findOne({
      where: { id },
      relations: { productos: true, hijos: true },
    });

    if (!categoria) {
      throw new NotFoundException(`La categoría con ID '${id}' no existe`);
    }

    const tieneProductos = categoria.productos && categoria.productos.length > 0;
    const tieneSubcategorias = categoria.hijos && categoria.hijos.length > 0;

    if (tieneProductos || tieneSubcategorias) {
      // Si tiene productos o subcategorías, realizar borrado lógico para preservar integridad
      categoria.esta_activo = false;
      await this.repositorioCategoria.save(categoria);
      return {
        mensaje: `La categoría '${categoria.nombre}' fue desactivada porque tiene productos o subcategorías asociadas`,
        borrado_logico: true,
      };
    }

    await this.repositorioCategoria.remove(categoria);
    return {
      mensaje: `La categoría '${categoria.nombre}' fue eliminada permanentemente del sistema`,
      borrado_logico: false,
    };
  }
}
