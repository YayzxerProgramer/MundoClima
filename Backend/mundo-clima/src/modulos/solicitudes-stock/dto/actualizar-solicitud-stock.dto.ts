import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoSolicitudStock } from '../entidades/solicitud-stock.entity';

/**
 * DTO para la gestión comercial y cambio de estado por el asesor o administrador
 */
export class ActualizarSolicitudStockDto {
  @IsOptional()
  @IsEnum(EstadoSolicitudStock, { message: 'El estado de la solicitud no es válido' })
  estado?: EstadoSolicitudStock;

  @IsOptional()
  @IsString()
  notas_asesor?: string;
}
