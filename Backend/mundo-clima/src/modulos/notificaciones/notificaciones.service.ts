import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Orden } from '../ordenes/entidades/orden.entity';
import { Producto } from '../productos/entidades/producto.entity';

/**
 * Servicio encargado de la emisión de Webhooks en tiempo real hacia n8n / plataformas externas
 */
@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Emite un webhook hacia n8n cuando una orden de compra es pagada con éxito
   */
  async notificarOrdenPagada(orden: Orden): Promise<boolean> {
    const webhookUrl =
      this.configService.get<string>('N8N_WEBHOOK_URL') ||
      this.configService.get<string>('N8N_WEBHOOK_ORDEN_PAGADA');

    const payload = {
      evento: 'ORDEN_PAGADA',
      fecha: new Date(),
      orden: {
        id: orden.id,
        referencia: orden.referencia,
        total: orden.total,
        metodo_pago: orden.metodo_pago,
        wompi_transaccion_id: orden.wompi_transaccion_id,
        cliente: {
          id: orden.usuario?.id,
          nombre: orden.usuario?.nombre_completo,
          email: orden.usuario?.email,
          telefono: orden.usuario?.telefono,
          rol_b2b: orden.usuario?.rol,
        },
        direccion_envio: orden.direccion_envio,
        items: orden.items?.map((item) => ({
          producto_id: item.producto_id,
          nombre: item.nombre_producto,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
        })),
      },
    };

    return await this.enviarWebhook('ORDEN_PAGADA', webhookUrl, payload);
  }

  /**
   * Emite un webhook hacia n8n cuando se genera una guía de despacho con Coordinadora Mercantil
   */
  async notificarGuiaDespachada(orden: Orden): Promise<boolean> {
    const webhookUrl =
      this.configService.get<string>('N8N_WEBHOOK_URL') ||
      this.configService.get<string>('N8N_WEBHOOK_GUIA_CREADA');

    const payload = {
      evento: 'GUIA_DESPACHADA',
      fecha: new Date(),
      referencia_orden: orden.referencia,
      coordinadora: {
        numero_guia: orden.coordinadora_numero_guia,
        url_rotulo: orden.coordinadora_url_rotulo,
        estado: orden.coordinadora_estado_envio,
      },
      cliente: {
        nombre: orden.usuario?.nombre_completo,
        email: orden.usuario?.email,
        telefono: orden.usuario?.telefono,
      },
    };

    return await this.enviarWebhook('GUIA_DESPACHADA', webhookUrl, payload);
  }

  /**
   * Emite una alerta a n8n cuando un producto entra en estado de stock bajo
   */
  async notificarStockBajo(producto: Producto): Promise<boolean> {
    const webhookUrl =
      this.configService.get<string>('N8N_WEBHOOK_URL') ||
      this.configService.get<string>('N8N_WEBHOOK_STOCK_BAJO');

    const payload = {
      evento: 'STOCK_BAJO_ALERTA',
      fecha: new Date(),
      producto: {
        id: producto.id,
        sku: producto.sku,
        nombre: producto.nombre,
        stock_actual: producto.inventario_stock,
        stock_minimo_alerta: producto.alerta_stock_minimo,
      },
    };

    return await this.enviarWebhook('STOCK_BAJO_ALERTA', webhookUrl, payload);
  }

  /**
   * Método auxiliar para ejecutar peticiones HTTP POST asíncronas hacia n8n
   */
  private async enviarWebhook(
    nombreEvento: string,
    url: string | undefined,
    payload: any,
  ): Promise<boolean> {
    if (!url) {
      this.logger.debug(
        `Webhook n8n (${nombreEvento}): No se configuró URL en .env. Evento preparado.`,
      );
      return false;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        this.logger.log(`Webhook n8n (${nombreEvento}) emitido con éxito a ${url}`);
        return true;
      } else {
        this.logger.warn(
          `Webhook n8n (${nombreEvento}) respondió con status HTTP ${response.status}`,
        );
        return false;
      }
    } catch (error: any) {
      this.logger.error(
        `Error emitiendo Webhook n8n (${nombreEvento}): ${error?.message || error}`,
      );
      return false;
    }
  }
}
