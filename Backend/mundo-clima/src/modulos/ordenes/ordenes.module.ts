import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Orden } from './entidades/orden.entity';
import { ItemOrden } from './entidades/item-orden.entity';
import { Producto } from '../productos/entidades/producto.entity';
import { PrecioNivelCliente } from '../productos/entidades/precio-nivel-cliente.entity';
import { EnviosModule } from '../envios/envios.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { OrdenesController } from './ordenes.controller';
import { OrdenesService } from './ordenes.service';

/**
 * Módulo de órdenes de compra para Mundo Clima
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Orden,
      ItemOrden,
      Producto,
      PrecioNivelCliente,
    ]),
    EnviosModule,
    NotificacionesModule,
  ],
  controllers: [OrdenesController],
  providers: [OrdenesService],
  exports: [OrdenesService],
})
export class OrdenesModule {}
