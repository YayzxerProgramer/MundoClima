import { Module } from '@nestjs/common';
import { CoordinadoraService } from './coordinadora.service';
import { EnviosController } from './envios.controller';

/**
 * Módulo de Envíos y Logística
 */
@Module({
  controllers: [EnviosController],
  providers: [CoordinadoraService],
  exports: [CoordinadoraService],
})
export class EnviosModule {}
