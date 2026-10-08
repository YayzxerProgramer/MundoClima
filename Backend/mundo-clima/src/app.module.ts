import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { obtenerConfiguracionTypeOrm } from './configuracion/typeorm.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoriasModule } from './modulos/categorias/categorias.module';
import { MarcasModule } from './modulos/marcas/marcas.module';
import { ProductosModule } from './modulos/productos/productos.module';
import { SemillaModule } from './modulos/semilla/semilla.module';
import { UsuariosModule } from './modulos/usuarios/usuarios.module';
import { AuthModule } from './modulos/auth/auth.module';
import { OrdenesModule } from './modulos/ordenes/ordenes.module';
import { EnviosModule } from './modulos/envios/envios.module';
import { PagosModule } from './modulos/pagos/pagos.module';
import { NotificacionesModule } from './modulos/notificaciones/notificaciones.module';
import { EstadisticasModule } from './modulos/estadisticas/estadisticas.module';

/**
 * Módulo principal de la aplicación NestJS para Mundo Clima
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 100, // Máximo 100 peticiones globales por minuto por IP
      },
    ]),
    TypeOrmModule.forRootAsync({
      useFactory: () => obtenerConfiguracionTypeOrm(),
    }),
    CategoriasModule,
    MarcasModule,
    ProductosModule,
    SemillaModule,
    UsuariosModule,
    AuthModule,
    OrdenesModule,
    EnviosModule,
    PagosModule,
    NotificacionesModule,
    EstadisticasModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
