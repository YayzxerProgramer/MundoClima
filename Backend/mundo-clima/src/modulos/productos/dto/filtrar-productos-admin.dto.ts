import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para la consulta y paginación de productos en el panel de administración
 */
export class FiltrarProductosAdminDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  categoria_id?: string;

  @IsOptional()
  @IsString()
  marca_id?: string;

  @IsOptional()
  esta_activo?: boolean | string;

  @IsOptional()
  solo_stock_bajo?: boolean | string;

  @IsOptional()
  @IsString()
  ordenarPor?: string;

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
