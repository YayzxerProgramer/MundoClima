import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Producto } from '../../productos/entidades/producto.entity';
import { Usuario } from '../../usuarios/entidades/usuario.entity';

export enum EstadoSolicitudStock {
  PENDIENTE = 'PENDIENTE',         // Recibida, pendiente de llamada del asesor
  CONTACTADO = 'CONTACTADO',       // Asesor se comunicó con el cliente
  COTIZADO = 'COTIZADO',           // Se le envió cotización formal
  CONVERTIDO = 'CONVERTIDO',       // Se cerró en orden de compra
  DESCARTADO = 'DESCARTADO',       // Cliente desistió o datos erróneos
}

@Entity('solicitudes_stock')
export class SolicitudStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  producto_id: string;

  @ManyToOne(() => Producto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @Column({ type: 'uuid', nullable: true })
  usuario_id: string | null;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario | null;

  @Column({ type: 'varchar', length: 150 })
  nombre_completo: string;

  @Column({ type: 'varchar', length: 150 })
  email: string;

  @Column({ type: 'varchar', length: 50 })
  telefono: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ciudad: string | null;

  @Column({ type: 'int', default: 1 })
  cantidad: number;

  @Column({ type: 'text', nullable: true })
  comentarios: string | null;

  @Column({
    type: 'enum',
    enum: EstadoSolicitudStock,
    default: EstadoSolicitudStock.PENDIENTE,
  })
  estado: EstadoSolicitudStock;

  @Column({ type: 'text', nullable: true })
  notas_asesor: string | null;

  @CreateDateColumn()
  creado_en: Date;

  @UpdateDateColumn()
  actualizado_en: Date;
}
