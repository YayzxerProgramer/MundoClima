import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { WompiService } from './wompi.service';

/**
 * Controlador REST para procesamiento de pagos con Wompi
 */
@Controller('pagos')
export class PagosController {
  constructor(private readonly wompiService: WompiService) {}

  /**
   * Genera los parámetros firmados con SHA-256 para iniciar la transacción en Wompi Widget
   */
  @Get('wompi/firma/:ordenId')
  generarFirmaWompi(@Param('ordenId') ordenId: string) {
    return this.wompiService.generarParametrosPago(ordenId);
  }

  /**
   * Endpoint público de Webhook para recibir notificaciones automáticas de Wompi
   */
  @Post('wompi/webhook')
  @HttpCode(HttpStatus.OK)
  procesarWebhookWompi(@Body() body: any) {
    return this.wompiService.procesarWebhook(body);
  }
}
