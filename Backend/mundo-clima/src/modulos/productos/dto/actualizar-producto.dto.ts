import { PartialType } from '@nestjs/mapped-types';
import { CrearProductoDto } from './crear-producto.dto';

/**
 * DTO para la actualización de un producto existente desde el panel de administración
 */
export class ActualizarProductoDto extends PartialType(CrearProductoDto) {}
