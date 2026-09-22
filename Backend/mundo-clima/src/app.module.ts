import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { obtenerConfiguracionTypeOrm } from './configuracion/typeorm.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoriasModule } from './modulos/categorias/categorias.module';
import { MarcasModule } from './modulos/marcas/marcas.module';
import { ProductosModule } from './modulos/productos/productos.module';
import { SemillaModule } from './modulos/semilla/semilla.module';
import { UsuariosModule } from './modulos/usuarios/usuarios.module';
import { AuthModule } from './modulos/auth/auth.module';

/**
 * Módulo principal de la aplicación NestJS para Mundo Clima
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => obtenerConfiguracionTypeOrm(),
    }),
    CategoriasModule,
    MarcasModule,
    ProductosModule,
    SemillaModule,
    UsuariosModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
