import { Module } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';

/**
 * Módulo de Notificaciones y Webhooks para n8n
 */
@Module({
  providers: [NotificacionesService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
