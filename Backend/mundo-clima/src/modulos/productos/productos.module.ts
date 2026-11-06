import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './entidades/producto.entity';
import { PrecioNivelCliente } from './entidades/precio-nivel-cliente.entity';
import { ItemOrden } from '../ordenes/entidades/item-orden.entity';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Producto, PrecioNivelCliente, ItemOrden])],
  providers: [ProductosService],
  controllers: [ProductosController],
  exports: [ProductosService, TypeOrmModule],
})
export class ProductosModule {}
