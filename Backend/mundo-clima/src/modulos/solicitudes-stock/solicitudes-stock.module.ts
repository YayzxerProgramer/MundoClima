import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitudStock } from './entidades/solicitud-stock.entity';
import { Producto } from '../productos/entidades/producto.entity';
import { SolicitudesStockService } from './solicitudes-stock.service';
import { SolicitudesStockController } from './solicitudes-stock.controller';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SolicitudStock, Producto]),
    NotificacionesModule,
  ],
  controllers: [SolicitudesStockController],
  providers: [SolicitudesStockService],
  exports: [SolicitudesStockService],
})
export class SolicitudesStockModule {}
