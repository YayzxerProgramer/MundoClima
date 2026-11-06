import { IsBoolean } from 'class-validator';

/**
 * DTO para activar o desactivar un producto
 */
export class ActualizarEstadoProductoDto {
  @IsBoolean({ message: 'El estado debe ser un valor booleano' })
  esta_activo: boolean;
}
