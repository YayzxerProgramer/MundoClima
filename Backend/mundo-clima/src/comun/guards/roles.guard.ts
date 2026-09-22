import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CLAVE_ROLES } from '../decoradores/roles.decorador';
import { RolUsuario } from '../enums/hvac.enums';

/**
 * Guard para validar que el usuario autenticado tenga uno de los roles permitidos.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<RolUsuario[]>(
      CLAVE_ROLES,
      [context.getHandler(), context.getClass()],
    );

    // Si la ruta no especifica roles requeridos, se permite el acceso
    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.rol) {
      throw new ForbiddenException(
        'Acceso denegado: Se requiere autenticación para verificar los permisos',
      );
    }

    const tieneRolPermitido = rolesRequeridos.includes(user.rol);

    if (!tieneRolPermitido) {
      throw new ForbiddenException(
        `Acceso denegado: El rol '${user.rol}' no tiene permisos suficientes para ejecutar esta acción`,
      );
    }

    return true;
  }
}
