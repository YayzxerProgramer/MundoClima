import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { RolUsuario } from '../../../comun/enums/hvac.enums';

/**
 * DTO para la creación de usuarios desde el panel de administración
 */
export class CrearUsuarioDto {
  @IsString({ message: 'El nombre completo es obligatorio' })
  nombre_completo: string;

  @IsEmail({}, { message: 'Debe ingresar un correo electrónico válido' })
  email: string;

  @IsString({ message: 'La contraseña debe ser una cadena válida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsOptional()
  @IsEnum(RolUsuario, { message: 'El rol de usuario proporcionado no es válido' })
  rol?: RolUsuario = RolUsuario.CLIENTE_FINAL;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  documento_identidad?: string;

  @IsOptional()
  @IsString()
  nombre_empresa?: string;

  @IsOptional()
  @IsBoolean()
  esta_activo?: boolean = true;
}
