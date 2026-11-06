import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RolUsuario } from '../../../comun/enums/hvac.enums';

/**
 * DTO para filtrado y paginación de usuarios en el panel administrativo
 */
export class FiltrarUsuariosDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(RolUsuario)
  rol?: RolUsuario;

  @IsOptional()
  esta_activo?: boolean | string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pagina?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limite?: number;
}
