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
import { Categoria } from '../../categorias/entidades/categoria.entity';
import { Marca } from '../../marcas/entidades/marca.entity';
import { PrecioNivelCliente } from './precio-nivel-cliente.entity';
import {
  TipoEquipoHvac,
  RefrigeranteHvac,
  VoltajeHvac,
} from '../../../comun/enums/hvac.enums';

@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  sku: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'text', nullable: true })
  descripcion_corta: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  precio_base: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  precio_costo: number;

  @Column({ type: 'int', default: 0 })
  inventario_stock: number;

  @Column({ type: 'int', default: 5 })
  alerta_stock_minimo: number;

  @Column({ type: 'varchar', length: 50, default: 'Unidad' })
  unidad_medida: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 1.0 })
  peso_kg: number;

  @Column({ type: 'boolean', default: true })
  esta_activo: boolean;

  @Column({ type: 'boolean', default: false })
  es_destacado: boolean;

  @Column({ type: 'simple-array', nullable: true })
  imagenes: string[];

  // Especificaciones Técnicas HVAC/R indizadas para el buscador facetado estilo Homecenter
  @Column({ type: 'int', nullable: true })
  btu: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tipo_refrigerante: RefrigeranteHvac | string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  voltaje: VoltajeHvac | string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  tipo_equipo: TipoEquipoHvac | string | null;

  @Column({ type: 'json', nullable: true })
  especificaciones: Record<string, string | number> | null;

  // Relaciones
  @Column({ type: 'uuid', nullable: true })
  categoria_id: string | null;

  @ManyToOne(() => Categoria, (categoria) => categoria.productos, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria | null;

  @Column({ type: 'uuid', nullable: true })
  marca_id: string | null;

  @ManyToOne(() => Marca, (marca) => marca.productos, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'marca_id' })
  marca: Marca | null;

  @OneToMany(() => PrecioNivelCliente, (precioNivel) => precioNivel.producto, {
    cascade: true,
  })
  precios_nivel: PrecioNivelCliente[];

  @CreateDateColumn()
  creado_en: Date;

  @UpdateDateColumn()
  actualizado_en: Date;
}
