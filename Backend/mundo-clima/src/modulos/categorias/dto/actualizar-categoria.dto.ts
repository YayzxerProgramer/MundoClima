import { PartialType } from '@nestjs/mapped-types';
import { CrearCategoriaDto } from './crear-categoria.dto';

/**
 * DTO para la actualización de categorías desde el panel de administración
 */
export class ActualizarCategoriaDto extends PartialType(CrearCategoriaDto) {}
