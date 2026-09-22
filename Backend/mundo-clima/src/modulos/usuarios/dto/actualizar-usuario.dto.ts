import { PartialType } from '@nestjs/mapped-types';
import { CrearUsuarioDto } from './crear-usuario.dto';

/**
 * DTO para la actualización de datos de usuario (todos los campos opcionales)
 */
export class ActualizarUsuarioDto extends PartialType(CrearUsuarioDto) {}
