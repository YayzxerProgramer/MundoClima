import { PartialType } from '@nestjs/mapped-types';
import { CrearMarcaDto } from './crear-marca.dto';

/**
 * DTO para la actualización de marcas desde el panel de administración
 */
export class ActualizarMarcaDto extends PartialType(CrearMarcaDto) {}
