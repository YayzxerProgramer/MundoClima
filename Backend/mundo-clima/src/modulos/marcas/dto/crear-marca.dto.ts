import { IsString, IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO para la creación de marcas desde el panel de administración
 */
export class CrearMarcaDto {
  @IsString({ message: 'El nombre de la marca es obligatorio' })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'El slug debe ser una cadena válida' })
  slug?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsBoolean()
  esta_activo?: boolean = true;
}
