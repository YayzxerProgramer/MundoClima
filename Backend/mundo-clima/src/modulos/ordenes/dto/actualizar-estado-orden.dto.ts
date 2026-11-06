import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoOrden } from '../../../comun/enums/hvac.enums';

/**
 * DTO para actualizar el estado de una orden desde el panel de administración
 */
export class ActualizarEstadoOrdenDto {
  @IsEnum(EstadoOrden, { message: 'El estado de la orden no es válido' })
  estado: EstadoOrden;

  @IsOptional()
  @IsString()
  notas?: string;
}
