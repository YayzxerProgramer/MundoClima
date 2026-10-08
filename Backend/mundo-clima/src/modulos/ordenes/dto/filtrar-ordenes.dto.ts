import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoOrden } from '../../../comun/enums/hvac.enums';

/**
 * DTO para filtrado y paginación de órdenes en el panel de administración
 */
export class FiltrarOrdenesDto {
  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @IsOptional()
  @IsEnum(EstadoOrden)
  estado?: EstadoOrden;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pagina?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limite?: number = 10;
}
