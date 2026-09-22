import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RolUsuario } from '../../../comun/enums/hvac.enums';

/**
 * Entidad Usuario que representa a los usuarios del sistema (Admin, Clientes, Técnicos y Distribuidores)
 */
@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  nombre_completo: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false }) // Encriptado con bcryptjs (oculto por defecto en selects)
  password: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: RolUsuario.CLIENTE_FINAL,
  })
  rol: RolUsuario;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telefono?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  documento_identidad?: string; 

  @Column({ type: 'varchar', length: 150, nullable: true })
  nombre_empresa?: string; 

  @Column({ type: 'boolean', default: true })
  esta_activo: boolean;

  @CreateDateColumn()
  creado_en: Date;

  @UpdateDateColumn()
  actualizado_en: Date;
}
