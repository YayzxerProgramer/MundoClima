import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsuariosService } from '../usuarios/usuarios.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import { Usuario } from '../usuarios/entidades/usuario.entity';
import { PayloadJwt } from './estrategias/jwt.estrategia';

/**
 * Servicio de Autenticación para gestionar el registro, login y generación de tokens JWT
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registra un nuevo usuario en la plataforma y genera su token inicial
   */
  async registro(registroDto: RegistroDto) {
    const nuevoUsuario = await this.usuariosService.crear(registroDto);

    const token = this.generarTokenJwt(nuevoUsuario);

    return {
      mensaje: 'Registro de usuario exitoso',
      access_token: token,
      usuario: {
        id: nuevoUsuario.id,
        nombre_completo: nuevoUsuario.nombre_completo,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
        telefono: nuevoUsuario.telefono,
        documento_identidad: nuevoUsuario.documento_identidad,
        nombre_empresa: nuevoUsuario.nombre_empresa,
      },
    };
  }

  /**
   * Autentica a un usuario verificando correo y contraseña encriptada con bcryptjs
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar usuario incluyendo su contraseña para validación
    const usuario = await this.usuariosService.buscarPorEmail(email, true);

    if (!usuario) {
      throw new UnauthorizedException(
        'Credenciales inválidas: Correo electrónico o contraseña incorrectos',
      );
    }

    if (!usuario.esta_activo) {
      throw new UnauthorizedException(
        'La cuenta de usuario se encuentra inactiva o suspendida',
      );
    }

    // Comparar la contraseña ingresada con el hash guardado en base de datos
    const esPasswordValida = await bcrypt.compare(password, usuario.password);

    if (!esPasswordValida) {
      throw new UnauthorizedException(
        'Credenciales inválidas: Correo electrónico o contraseña incorrectos',
      );
    }

    const token = this.generarTokenJwt(usuario);

    // Preparar objeto de respuesta sin exponer la contraseña
    delete (usuario as any).password;

    return {
      mensaje: 'Inicio de sesión exitoso',
      access_token: token,
      usuario: {
        id: usuario.id,
        nombre_completo: usuario.nombre_completo,
        email: usuario.email,
        rol: usuario.rol,
        telefono: usuario.telefono,
        documento_identidad: usuario.documento_identidad,
        nombre_empresa: usuario.nombre_empresa,
      },
    };
  }

  /**
   * Retorna los datos del perfil del usuario actualmente autenticado
   */
  async obtenerPerfil(usuarioId: string) {
    return await this.usuariosService.buscarPorId(usuarioId);
  }

  /**
   * Firma digitalmente un token JWT con la información de identidad del usuario
   */
  private generarTokenJwt(usuario: Usuario): string {
    const payload: PayloadJwt = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    };

    return this.jwtService.sign(payload);
  }
}
