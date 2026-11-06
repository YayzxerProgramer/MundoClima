import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

/**
 * DTO para la creación de categorías desde el panel de administración
 */
export class CrearCategoriaDto {
  @IsString({ message: 'El nombre de la categoría es obligatorio' })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'El slug debe ser una cadena válida' })
  slug?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  imagen_url?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de la categoría padre debe ser un UUID válido' })
  categoria_padre_id?: string | null;

  @IsOptional()
  @IsBoolean()
  esta_activo?: boolean = true;
}
