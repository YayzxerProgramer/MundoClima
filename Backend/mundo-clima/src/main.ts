import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const registrador = new Logger('Inicio');
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para integración con el frontend en React
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Prefijo global para la API REST
  app.setGlobalPrefix('api');

  // Tuberia de Validación global para transformación de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const puerto = process.env.PORT || 3000;
  await app.listen(puerto);
  registrador.log(`🚀 Servidor Mundo Clima Backend iniciado en: http://localhost:${puerto}/api`);
}
bootstrap();
