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
import { FiltrarUsuariosDto } from './dto/filtrar-usuarios.dto';
import { RolUsuario } from '../../comun/enums/hvac.enums';

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

    delete (usuario as any).password;
    return usuario;
  }

  /**
   * Obtiene el listado de usuarios con soporte para búsqueda, filtros y paginación
   */
  async obtenerTodos(filtroDto?: FiltrarUsuariosDto): Promise<any> {
    const consulta = this.usuarioRepositorio
      .createQueryBuilder('usuario')
      .orderBy('usuario.creado_en', 'DESC');

    if (filtroDto?.q) {
      consulta.andWhere(
        '(usuario.nombre_completo ILIKE :q OR usuario.email ILIKE :q OR usuario.documento_identidad ILIKE :q OR usuario.telefono ILIKE :q)',
        { q: `%${filtroDto.q}%` },
      );
    }

    if (filtroDto?.rol) {
      consulta.andWhere('usuario.rol = :rol', { rol: filtroDto.rol });
    }

    if (filtroDto?.esta_activo !== undefined && filtroDto?.esta_activo !== '') {
      const activoBool =
        filtroDto.esta_activo === true || filtroDto.esta_activo === 'true';
      consulta.andWhere('usuario.esta_activo = :activoBool', { activoBool });
    }

    // Si se especifica paginación en el DTO, retornar objeto paginado
    if (filtroDto?.pagina || filtroDto?.limite) {
      const pagina = filtroDto.pagina || 1;
      const limite = filtroDto.limite || 10;
      const salto = (pagina - 1) * limite;

      consulta.skip(salto).take(limite);
      const [usuarios, total] = await consulta.getManyAndCount();

      return {
        datos: usuarios,
        meta: {
          total,
          pagina,
          limite,
          totalPaginas: Math.ceil(total / limite),
        },
      };
    }

    // Por compatibilidad con clientes existentes que esperan un arreglo directo
    return await consulta.getMany();
  }

  /**
   * Actualiza los datos de un usuario existente
   */
  async actualizar(
    id: string,
    actualizarUsuarioDto: ActualizarUsuarioDto,
  ): Promise<Usuario> {
    const usuario = await this.usuarioRepositorio.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException(`No se encontró ningún usuario con ID '${id}'`);
    }

    const { password, email, ...restoDatos } = actualizarUsuarioDto;

    if (email) {
      const emailNuevo = email.toLowerCase().trim();
      if (emailNuevo !== usuario.email) {
        const existente = await this.usuarioRepositorio.findOne({
          where: { email: emailNuevo },
        });
        if (existente && existente.id !== id) {
          throw new ConflictException(
            `El correo electrónico '${emailNuevo}' ya está en uso`,
          );
        }
        usuario.email = emailNuevo;
      }
    }

    // Actualizar contraseña solo si se envió una válida y con longitud >= 6
    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      usuario.password = await bcrypt.hash(password.trim(), salt);
    }

    Object.assign(usuario, restoDatos);
    const usuarioActualizado = await this.usuarioRepositorio.save(usuario);

    delete (usuarioActualizado as any).password;
    return usuarioActualizado;
  }

  /**
   * Cambia el estado de activación de un usuario
   */
  async actualizarEstado(id: string, esta_activo: boolean): Promise<Usuario> {
    const usuario = await this.usuarioRepositorio.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException(`No se encontró ningún usuario con ID '${id}'`);
    }

    usuario.esta_activo = esta_activo;
    const usuarioGuardado = await this.usuarioRepositorio.save(usuario);
    delete (usuarioGuardado as any).password;
    return usuarioGuardado;
  }

  /**
   * Actualiza el rol del usuario (Ascenso a Técnico, Distribuidor o Administrador)
   */
  async actualizarRol(id: string, rol: RolUsuario): Promise<Usuario> {
    const usuario = await this.usuarioRepositorio.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException(`No se encontró ningún usuario con ID '${id}'`);
    }

    usuario.rol = rol;
    const usuarioGuardado = await this.usuarioRepositorio.save(usuario);
    delete (usuarioGuardado as any).password;
    return usuarioGuardado;
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
