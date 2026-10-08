import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Orden } from './orden.entity';

/*
*
 * Entidad ItemOrden que representa un ítem individual dentro de una orden de compra
 */
@Entity('items_orden')
export class ItemOrden {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orden_id: string;

  @ManyToOne(() => Orden, (orden) => orden.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orden_id' })
  orden: Orden;

  @Column({ type: 'uuid' })
  producto_id: string;

  @Column({ type: 'varchar', length: 255 })
  nombre_producto: string;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  precio_unitario: number;
}
