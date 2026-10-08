import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WompiService } from './wompi.service';
import { PagosController } from './pagos.controller';
import { Orden } from '../ordenes/entidades/orden.entity';
import { EnviosModule } from '../envios/envios.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

/**
 * Módulo de Pagos con integración Wompi Colombia
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Orden]),
    EnviosModule,
    NotificacionesModule,
  ],
  controllers: [PagosController],
  providers: [WompiService],
  exports: [WompiService],
})
export class PagosModule {}
