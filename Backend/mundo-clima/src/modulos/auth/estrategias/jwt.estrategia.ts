import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { RolUsuario } from '../../../comun/enums/hvac.enums';

export interface PayloadJwt {
  sub: string;
  email: string;
  rol: RolUsuario;
}

/**
 * Estrategia de autenticación Passport para validar el JsonWebToken (JWT) en peticiones HTTP
 */
@Injectable()
export class JwtEstrategia extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usuariosService: UsuariosService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT                          _SECRET'),
    });
  }

  /**
   * Valida la firma del payload del JWT y retorna los datos del usuario autenticado.
   */
  async validate(payload: PayloadJwt) {
    const usuario = await this.usuariosService.buscarPorId(payload.sub);

    if (!usuario) {
      throw new UnauthorizedException(
        'El usuario asociado al token ya no existe',
      );
    }

    if (!usuario.esta_activo) {
      throw new UnauthorizedException(
        'La cuenta de usuario se encuentra inactiva o suspendida',
      );
    }

    return usuario;
  }
}
