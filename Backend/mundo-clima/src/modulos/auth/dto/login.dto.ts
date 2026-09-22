import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * DTO para el inicio de sesión de usuarios
 */
export class LoginDto {
  @IsEmail({}, { message: 'Debe ingresar un correo electrónico válido' })
  email: string;
 
  @IsString({ message: 'Debe ingresar su contraseña' })
  @MinLength(6, { message: 'La contraseña debe contener al menos 6 caracteres' })
  password: string;
}
