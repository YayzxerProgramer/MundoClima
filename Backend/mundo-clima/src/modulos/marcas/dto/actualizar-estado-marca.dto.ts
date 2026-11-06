import { IsBoolean } from 'class-validator';

/**
 * DTO para activar o desactivar una marca
 */
export class ActualizarEstadoMarcaDto {
  @IsBoolean({ message: 'El estado debe ser un valor booleano' })
  esta_activo: boolean;
}
