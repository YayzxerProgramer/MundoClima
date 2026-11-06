import { IsBoolean } from 'class-validator';

/**
 * DTO para activar o desactivar una categoría
 */
export class ActualizarEstadoCategoriaDto {
  @IsBoolean({ message: 'El estado debe ser un valor booleano' })
  esta_activo: boolean;
}
