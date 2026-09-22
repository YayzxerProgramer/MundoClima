import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { RolUsuario } from '../../../comun/enums/hvac.enums';

/**
 * DTO para el registro de nuevos usuarios en el sistema
 */
export class RegistroDto {
  @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
  nombre_completo: string;

  @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
  email: string;

  @IsString({ message: 'La contraseña debe ser un texto válido' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsOptional()
  @IsEnum(RolUsuario, { message: 'El rol especificado no es válido' })
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
}
