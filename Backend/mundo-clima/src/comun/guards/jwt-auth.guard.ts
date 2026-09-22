import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard estricto para validar que la petición incluya un token JWT válido en la cabecera Authorization: Bearer <token>.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'Acceso no autorizado: Debe iniciar sesión y proporcionar un token JWT válido',
        )
      );
    }
    return user;
  }
}
