import { IsEnum } from 'class-validator';
import { RolUsuario } from '../../../comun/enums/hvac.enums';

/**
 * DTO para cambio de rol de usuario desde administración
 */
export class ActualizarRolUsuarioDto {
  @IsEnum(RolUsuario, { message: 'El rol proporcionado no es válido' })
  rol: RolUsuario;
}
