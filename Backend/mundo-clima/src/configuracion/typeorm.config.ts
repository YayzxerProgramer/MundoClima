import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Categoria } from '../modulos/categorias/entidades/categoria.entity';
import { Marca } from '../modulos/marcas/entidades/marca.entity';
import { Producto } from '../modulos/productos/entidades/producto.entity';
import { PrecioNivelCliente } from '../modulos/productos/entidades/precio-nivel-cliente.entity';
import { Usuario } from '../modulos/usuarios/entidades/usuario.entity';

/**
 * Configuración exclusiva para base de datos PostgreSQL en Mundo Clima.
 */
export const obtenerConfiguracionTypeOrm = (): TypeOrmModuleOptions => {
  return {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [Categoria, Marca, Producto, PrecioNivelCliente, Usuario],
    synchronize: true,
    logging: process.env.NODE_ENV !== 'production', 
  };
};
