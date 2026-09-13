import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Categoria } from '../modulos/categorias/entidades/categoria.entity';
import { Marca } from '../modulos/marcas/entidades/marca.entity';
import { Producto } from '../modulos/productos/entidades/producto.entity';
import { PrecioNivelCliente } from '../modulos/productos/entidades/precio-nivel-cliente.entity';

/**
 * Configuración de TypeORM para la base de datos de Mundo Clima.
 * Soporta PostgreSQL (producción) y SQLite (desarrollo rápido).
 */
export const obtenerConfiguracionTypeOrm = (): TypeOrmModuleOptions => {
  const tipoBd = process.env.DB_TYPE || 'postgres';

  if (tipoBd === 'sqlite' || tipoBd === 'better-sqlite3') {
    return {
      type: 'better-sqlite3',
      database: process.env.DB_DATABASE || 'mundo_clima.sqlite',
      entities: [Categoria, Marca, Producto, PrecioNivelCliente],
      synchronize: true, // Auto sincronización de tablas en desarrollo
      logging: process.env.NODE_ENV !== 'production',
    };
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'mundo_clima_db',
    entities: [Categoria, Marca, Producto, PrecioNivelCliente],
    synchronize: true, // Auto sincronización de tablas en desarrollo
    logging: process.env.NODE_ENV !== 'production',
  };
};
