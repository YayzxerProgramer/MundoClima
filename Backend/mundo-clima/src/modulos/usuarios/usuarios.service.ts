import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Usuario } from './entidades/usuario.entity';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto';

/**
 * Servicio para gestionar la lógica de negocio de los usuarios del sistema
 */
@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepositorio: Repository<Usuario>,
  ) {}

  /**
   * Crea un nuevo usuario en la base de datos encriptando su contraseña
   */
  async crear(crearUsuarioDto: CrearUsuarioDto): Promise<Usuario> {
    const { email, password, ...restoDatos } = crearUsuarioDto;

    // Verificar si el correo ya está registrado
    const usuarioExistente = await this.usuarioRepositorio.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (usuarioExistente) {
      throw new ConflictException(
        `El correo electrónico '${email}' ya se encuentra registrado en el sistema`,
      );
    }

    try {
      // Encriptar contraseña con bcryptjs (10 rondas de hashing)
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const nuevoUsuario = this.usuarioRepositorio.create({
        ...restoDatos,
        email: email.toLowerCase().trim(),
        password: passwordHash,
      });

      const usuarioGuardado = await this.usuarioRepositorio.save(nuevoUsuario);

      // Eliminar el hash de contraseña de la respuesta por seguridad
      delete (usuarioGuardado as any).password;
      return usuarioGuardado;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al crear el usuario en la base de datos',
        error.message,
      );
    }
  }

  /**
   * Busca un usuario por su correo electrónico.
   * Permite incluir opcionalmente la contraseña para el proceso de autenticación.
   */
  async buscarPorEmail(
    email: string,
    incluirPassword = false,
  ): Promise<Usuario | null> {
    const emailFormateado = email.toLowerCase().trim();

    if (!incluirPassword) {
      return await this.usuarioRepositorio.findOne({
        where: { email: emailFormateado },
      });
    }

    return await this.usuarioRepositorio
      .createQueryBuilder('usuario')
      .addSelect('usuario.password')
      .where('LOWER(usuario.email) = :email', { email: emailFormateado })
      .getOne();
  }

  /**
   * Busca un usuario por su ID único (UUID)
   */
  async buscarPorId(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepositorio.findOne({ where: { id } });

    if (!usuario) {
      throw new NotFoundException(
        `No se encontró ningún usuario con el ID '${id}'`,
      );
    }

    return usuario;
  }

  /**
   * Obtiene el listado completo de usuarios (Acceso Administrativo)
   */
  async obtenerTodos(): Promise<Usuario[]> {
    return await this.usuarioRepositorio.find({
      order: { creado_en: 'DESC' },
    });
  }

  /**
   * Actualiza los datos de un usuario existente
   */
  async actualizar(
    id: string,
    actualizarUsuarioDto: ActualizarUsuarioDto,
  ): Promise<Usuario> {
    const usuario = await this.buscarPorId(id);

    if (actualizarUsuarioDto.email) {
      const emailNuevo = actualizarUsuarioDto.email.toLowerCase().trim();
      if (emailNuevo !== usuario.email) {
        const existente = await this.usuarioRepositorio.findOne({
          where: { email: emailNuevo },
        });
        if (existente) {
          throw new ConflictException(
            `El correo electrónico '${emailNuevo}' ya está en uso`,
          );
        }
        usuario.email = emailNuevo;
      }
    }

    if (actualizarUsuarioDto.password) {
      const salt = await bcrypt.genSalt(10);
      usuario.password = await bcrypt.hash(actualizarUsuarioDto.password, salt);
    }

    Object.assign(usuario, actualizarUsuarioDto);
    const usuarioActualizado = await this.usuarioRepositorio.save(usuario);

    delete (usuarioActualizado as any).password;
    return usuarioActualizado;
  }

  /**
   * Elimina un usuario por su ID
   */
  async eliminar(id: string): Promise<{ mensaje: string }> {
    const usuario = await this.buscarPorId(id);
    await this.usuarioRepositorio.remove(usuario);
    return {
      mensaje: `El usuario '${usuario.nombre_completo}' fue eliminado correctamente`,
    };
  }
}
