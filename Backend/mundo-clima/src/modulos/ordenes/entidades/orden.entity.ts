import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entidades/usuario.entity';
import { ItemOrden } from './item-orden.entity';
import { EstadoOrden, MetodoPago } from '../../../comun/enums/hvac.enums';

/**
 * Interface que representa la dirección de envío en formato JSON
 */
export interface DireccionEnvioJson {
  calle: string;
  ciudad: string;
  departamento: string;
  telefono_contacto: string;
}

/**
 * Entidad Orden que representa una orden de compra en la plataforma
 */
@Entity('ordenes')
export class Orden {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  referencia: string;

  @Column({ type: 'uuid' })
  usuario_id: string;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({
    type: 'varchar',
    length: 50,
    default: EstadoOrden.PENDIENTE_PAGO,
  })
  estado: EstadoOrden;

  @Column({
    type: 'varchar',
    length: 50,
  })
  metodo_pago: MetodoPago;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  costo_envio: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ type: 'json' })
  direccion_envio: DireccionEnvioJson;

  // Datos de transacción de Wompi
  @Column({ type: 'varchar', length: 100, nullable: true })
  wompi_transaccion_id: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  wompi_estado: string | null;

  // Datos de envío con Coordinadora Mercantil
  @Column({ type: 'varchar', length: 100, nullable: true })
  coordinadora_numero_guia: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  coordinadora_url_rotulo: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  coordinadora_estado_envio: string | null;

  @OneToMany(() => ItemOrden, (item) => item.orden, { cascade: true })
  items: ItemOrden[];

  @CreateDateColumn()
  creado_en: Date;

  @UpdateDateColumn()
  actualizado_en: Date;
}
