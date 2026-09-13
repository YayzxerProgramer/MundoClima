import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Producto } from './producto.entity';
import { NivelCliente } from '../../../comun/enums/hvac.enums';

@Entity('precios_nivel_cliente')
export class PrecioNivelCliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  producto_id: string;

  @ManyToOne(() => Producto, (producto) => producto.precios_nivel, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @Column({
    type: 'varchar',
    length: 50,
    default: NivelCliente.CLIENTE_FINAL,
  })
  nivel_cliente: NivelCliente;

  @Column({ type: 'int', default: 1 })
  cantidad_minima: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  precio_especial: number;

  @CreateDateColumn()
  creado_en: Date;

  @UpdateDateColumn()
  actualizado_en: Date;
}
