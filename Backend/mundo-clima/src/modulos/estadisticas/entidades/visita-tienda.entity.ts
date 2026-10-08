import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * Entidad para registrar visitas/sesiones en la plataforma y calcular la tasa de conversión
 */
@Entity('visitas_tienda')
export class VisitaTienda {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ip_visitante: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pagina_visitada: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_agent: string | null;

  @CreateDateColumn()
  creado_en: Date;
}
