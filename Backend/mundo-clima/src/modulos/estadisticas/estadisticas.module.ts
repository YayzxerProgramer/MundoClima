import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadisticasService } from './estadisticas.service';
import { EstadisticasController } from './estadisticas.controller';
import { Orden } from '../ordenes/entidades/orden.entity';
import { ItemOrden } from '../ordenes/entidades/item-orden.entity';
import { Producto } from '../productos/entidades/producto.entity';
import { Usuario } from '../usuarios/entidades/usuario.entity';
import { VisitaTienda } from './entidades/visita-tienda.entity';

/**
 * Módulo de Estadísticas y Analítica de Negocio
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Orden, ItemOrden, Producto, Usuario, VisitaTienda]),
  ],
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
  exports: [EstadisticasService],
})
export class EstadisticasModule {}
