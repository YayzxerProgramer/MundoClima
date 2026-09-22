import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Categoria } from '../categorias/entidades/categoria.entity';
import { Marca } from '../marcas/entidades/marca.entity';
import { Producto } from '../productos/entidades/producto.entity';
import { PrecioNivelCliente } from '../productos/entidades/precio-nivel-cliente.entity';
import { Usuario } from '../usuarios/entidades/usuario.entity';
import { SemillaService } from './semilla.service';
import { SemillaController } from './semilla.controller';

/**
 * Módulo para inicializar datos de prueba (categorías, marcas, productos y usuarios por defecto)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Categoria,
      Marca,
      Producto,
      PrecioNivelCliente,
      Usuario,
    ]),
  ],
  providers: [SemillaService],
  controllers: [SemillaController],
})
export class SemillaModule {}
