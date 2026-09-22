import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard opcional de JWT.
 * Si la petición incluye un token Bearer válido, adjunta el usuario a req.user.
 * Si no incluye token o es inválido, NO lanza un error 401; permite el acceso anónimo con req.user = null.
 * Ideal para el catálogo de productos donde se desea aplicar precios B2B automáticamente si el usuario está autenticado.
 */
@Injectable()
export class JwtOpcionalGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      return null;
    }
    return user;
  }
}
