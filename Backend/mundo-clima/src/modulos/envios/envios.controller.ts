import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CoordinadoraService } from './coordinadora.service';
import { CotizarEnvioDto } from './dto/cotizar-envio.dto';

/**
 * Controlador REST para el servicio de logística y envíos con Coordinadora
 */
@Controller('envios')
export class EnviosController {
  constructor(private readonly coordinadoraService: CoordinadoraService) {}

  /**
   * Cotiza el valor del envío en tiempo real antes de procesar la compra
   */
  @Post('cotizar')
  @HttpCode(HttpStatus.OK)
  cotizarEnvio(@Body() dto: CotizarEnvioDto) {
    return this.coordinadoraService.cotizarEnvio(dto);
  }

  /**
   * Consulta el estado de rastreo de una guía de Coordinadora
   */
  @Get('rastreo/:numeroGuia')
  rastrearGuia(@Param('numeroGuia') numeroGuia: string) {
    return this.coordinadoraService.rastrearGuia(numeroGuia);
  }
}
