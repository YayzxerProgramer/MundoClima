import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Orden } from '../ordenes/entidades/orden.entity';
import { EstadoOrden } from '../../comun/enums/hvac.enums';
import { CoordinadoraService } from '../envios/coordinadora.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

/**
 * Servicio para procesar pagos y firmar transacciones con Wompi Colombia
 */
@Injectable()
export class WompiService {
  private readonly logger = new Logger(WompiService.name);

  constructor(
    @InjectRepository(Orden)
    private readonly ordenesRepository: Repository<Orden>,
    private readonly configService: ConfigService,
    private readonly coordinadoraService: CoordinadoraService,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  /**
   * Genera los parámetros y el hash de integridad SHA-256 requerido por el Widget de Wompi
   */
  async generarParametrosPago(ordenId: string) {
    const orden = await this.ordenesRepository.findOne({
      where: { id: ordenId },
      relations: { usuario: true, items: true },
    });

    if (!orden) {
      throw new NotFoundException(`La orden con ID '${ordenId}' no fue encontrada`);
    }

    const publicKey =
      this.configService.get<string>('WOMPI_PUBLIC_KEY') ||
      'pub_test_Q5y15KS2WDVr01TdWnRywwTkYijo0sW1';
    const integritySecret =
      this.configService.get<string>('WOMPI_INTEGRITY_SECRET') ||
      'test_integrity_ksj8349KJSDF9834';

    // Monto en centavos (ej: $150.000 COP -> 15000000)
    const montoEnCentavos = Math.round(Number(orden.total) * 100);
    const moneda = 'COP';
    const referencia = orden.referencia;

    // Cadena para firmar: Referencia + MontoEnCentavos + Moneda + SecretoIntegridad
    const cadenaAFirmar = `${referencia}${montoEnCentavos}${moneda}${integritySecret}`;
    const firmaIntegridad = crypto
      .createHash('sha256')
      .update(cadenaAFirmar)
      .digest('hex');

    this.logger.log(
      `🔐 Firma Wompi Generada: Orden ${referencia} ($${orden.total} COP) -> Hash SHA256: ${firmaIntegridad.substring(0, 16)}...`,
    );

    return {
      publicKey,
      referencia,
      montoEnCentavos,
      moneda,
      firmaIntegridad,
      orden: {
        id: orden.id,
        referencia: orden.referencia,
        total: orden.total,
        cliente_email: orden.usuario?.email || 'cliente@mundoclima.com',
        cliente_nombre: orden.usuario?.nombre_completo || 'Cliente Mundo Clima',
      },
    };
  }

  /**
   * Procesa la notificación Webhook asíncrona enviada por Wompi (POST /api/pagos/wompi/webhook)
   */
  async procesarWebhook(body: any) {
    this.logger.log(`📥 Webhook Wompi recibido: ${JSON.stringify(body.event || {})}`);

    const evento = body.event;
    const transaccion = body.data?.transaction;

    if (!transaccion || evento !== 'TRANSACTION.UPDATED') {
      return { mensaje: 'Evento ignorado o sin transacción activa' };
    }

    const { id: transaccionId, reference: referencia, status, amount_in_cents } = transaccion;

    // Buscar la orden correspondiente en la base de datos
    const orden = await this.ordenesRepository.findOne({
      where: { referencia },
      relations: { usuario: true },
    });

    if (!orden) {
      this.logger.warn(`⚠️ Webhook Wompi: No se encontró orden para la referencia '${referencia}'`);
      throw new NotFoundException(`Orden '${referencia}' no encontrada`);
    }

    // Actualizar estado de Wompi en la entidad Orden
    orden.wompi_transaccion_id = transaccionId;
    orden.wompi_estado = status;

    if (status === 'APPROVED') {
      orden.estado = EstadoOrden.PAGADO;
      this.logger.log(`✅ ¡PAGO APROBADO EN WOMPI! Orden ${referencia} marcada como PAGADO`);

      // Generar automáticamente la Guía de Transporte en Coordinadora Mercantil
      try {
        const guiaCoordinadora = await this.coordinadoraService.generarGuiaTransporte(
          orden.referencia,
          {
            nombre: orden.usuario?.nombre_completo || 'Cliente Mundo Clima',
            direccion: orden.direccion_envio?.calle || 'Dirección de Entrega',
            ciudad: orden.direccion_envio?.ciudad || 'Bogotá D.C.',
            telefono: orden.direccion_envio?.telefono_contacto || '3000000000',
          },
        );

        orden.coordinadora_numero_guia = guiaCoordinadora.numero_guia;
        orden.coordinadora_url_rotulo = guiaCoordinadora.url_rotulo_pdf;
        orden.coordinadora_estado_envio = guiaCoordinadora.estado;
        orden.estado = EstadoOrden.EN_CAMINO;

        this.logger.log(
          `🚚 Guía de Coordinadora asignada automáticamente: #${guiaCoordinadora.numero_guia} a Orden ${referencia}`,
        );
      } catch (err: any) {
        this.logger.error(`Error al generar guía con Coordinadora: ${err?.message || err}`);
      }
    } else if (status === 'DECLINED' || status === 'VOIDED') {
      orden.estado = EstadoOrden.CANCELADO;
      this.logger.warn(`❌ PAGO RECHAZADO EN WOMPI. Orden ${referencia} marcada como CANCELADO`);
    }

    await this.ordenesRepository.save(orden);

    if (status === 'APPROVED') {
      // Disparar Webhooks automáticos hacia n8n
      this.notificacionesService.notificarOrdenPagada(orden).catch(() => {});
      if (orden.coordinadora_numero_guia) {
        this.notificacionesService.notificarGuiaDespachada(orden).catch(() => {});
      }
    }

    return {
      exito: true,
      referencia,
      estado_pago: status,
      estado_orden: orden.estado,
      numero_guia_coordinadora: orden.coordinadora_numero_guia || null,
    };
  }
}
