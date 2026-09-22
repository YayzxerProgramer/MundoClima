import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Usuario } from '../../modulos/usuarios/entidades/usuario.entity';

/**
 * Decorador para extraer el usuario autenticado desde el objeto Request en los controladores.
 * Ejemplo: @ObtenerUsuario() usuario: Usuario  o  @ObtenerUsuario('id') usuarioId: string
 */
export const ObtenerUsuario = createParamDecorator(
  (data: keyof Usuario | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const usuario = request.user;

    if (!usuario) {
      return null;
    }

    return data ? usuario[data] : usuario;
  },
);
