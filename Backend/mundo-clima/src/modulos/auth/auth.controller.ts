import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../comun/guards/jwt-auth.guard';
import { ObtenerUsuario } from '../../comun/decoradores/obtener-usuario.decorador';
import { Usuario } from '../usuarios/entidades/usuario.entity';

/**
 * Controlador de Autenticación para registro, inicio de sesión y consulta de perfil
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registro público de nuevos usuarios
   */
  @Post('registro')
  registro(@Body() registroDto: RegistroDto) {
    return this.authService.registro(registroDto);
  }

  /**
   * Inicio de sesión de usuarios registrados
   */
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Obtiene la información del perfil del usuario autenticado
   */
  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  obtenerPerfil(@ObtenerUsuario() usuario: Usuario) {
    return this.authService.obtenerPerfil(usuario.id);
  }
}
