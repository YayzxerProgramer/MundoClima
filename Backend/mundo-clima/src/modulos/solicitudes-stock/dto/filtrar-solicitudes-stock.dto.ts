import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoSolicitudStock } from '../entidades/solicitud-stock.entity';

/**
 * DTO para filtrado y paginación de solicitudes en el panel comercial
 */
export class FiltrarSolicitudesStockDto {
  @IsOptional()
  @IsString()
  q?: string; // Búsqueda por nombre, email, teléfono, ciudad o producto

  @IsOptional()
  @IsEnum(EstadoSolicitudStock)
  estado?: EstadoSolicitudStock;

  @IsOptional()
  @IsString()
  producto_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pagina?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limite?: number = 15;
}
