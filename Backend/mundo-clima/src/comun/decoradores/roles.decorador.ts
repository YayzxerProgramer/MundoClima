import { SetMetadata } from '@nestjs/common';
import { RolUsuario } from '../enums/hvac.enums';

export const CLAVE_ROLES = 'roles';

/**
 * Decorador personalizado para restringir el acceso a controladores o métodos según el rol del usuario.
 * @param roles Lista de roles autorizados (ADMIN, TECNICO, DISTRIBUIDOR, CLIENTE_FINAL)
 */
export const Roles = (...roles: RolUsuario[]) => SetMetadata(CLAVE_ROLES, roles);
