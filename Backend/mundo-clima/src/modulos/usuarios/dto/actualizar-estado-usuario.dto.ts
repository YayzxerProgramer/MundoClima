import { IsBoolean } from 'class-validator';

/**
 * DTO para activar o desactivar un usuario
 */
export class ActualizarEstadoUsuarioDto {
  @IsBoolean({ message: 'El estado debe ser un valor booleano' })
  esta_activo: boolean;
}
