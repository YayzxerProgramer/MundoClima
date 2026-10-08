import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { WompiService } from './wompi.service';
import { Orden } from '../ordenes/entidades/orden.entity';
import { CoordinadoraService } from '../envios/coordinadora.service';
import { EstadoOrden, MetodoPago } from '../../comun/enums/hvac.enums';

describe('WompiService', () => {
  let service: WompiService;
  let ordenRepositoryMock: any;
  let coordinadoraServiceMock: any;

  beforeEach(async () => {
    ordenRepositoryMock = {
      findOne: jest.fn(),
      save: jest.fn((orden) => Promise.resolve(orden)),
    };

    coordinadoraServiceMock = {
      generarGuiaTransporte: jest.fn(() =>
        Promise.resolve({
          numero_guia: '7700987654321',
          url_rotulo_pdf: 'https://guias.coordinadora.com/rotulos/imprimir/7700987654321.pdf',
          estado: 'DESPACHADO',
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WompiService,
        {
          provide: getRepositoryToken(Orden),
          useValue: ordenRepositoryMock,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'WOMPI_PUBLIC_KEY') return 'pub_test_12345';
              if (key === 'WOMPI_INTEGRITY_SECRET') return 'test_integrity_secret';
              return null;
            }),
          },
        },
        {
          provide: CoordinadoraService,
          useValue: coordinadoraServiceMock,
        },
      ],
    }).compile();

    service = module.get<WompiService>(WompiService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe generar la firma SHA-256 de integridad para Wompi', async () => {
    const mockOrden: Partial<Orden> = {
      id: 'uuid-123',
      referencia: 'MC-2026-001',
      total: 150000,
      usuario: { email: 'tecnico@hvac.com', nombre_completo: 'Técnico HVAC' } as any,
    };

    ordenRepositoryMock.findOne.mockResolvedValue(mockOrden);

    const res = await service.generarParametrosPago('uuid-123');

    expect(res.referencia).toBe('MC-2026-001');
    expect(res.montoEnCentavos).toBe(15000000);
    expect(res.moneda).toBe('COP');
    expect(res.firmaIntegridad).toBeDefined();
    expect(res.firmaIntegridad.length).toBe(64); // Longitud estándar SHA-256
  });

  it('debe procesar un Webhook APROBADO de Wompi y generar guía con Coordinadora', async () => {
    const mockOrden: Partial<Orden> = {
      id: 'uuid-123',
      referencia: 'MC-2026-001',
      estado: EstadoOrden.PENDIENTE_PAGO,
      direccion_envio: {
        calle: 'Calle 100',
        ciudad: 'Bogotá D.C.',
        departamento: 'Cundinamarca',
        telefono_contacto: '3001234567',
      },
    };

    ordenRepositoryMock.findOne.mockResolvedValue(mockOrden);

    const payloadWebhook = {
      event: 'TRANSACTION.UPDATED',
      data: {
        transaction: {
          id: 'wompi-tx-999',
          reference: 'MC-2026-001',
          status: 'APPROVED',
          amount_in_cents: 15000000,
        },
      },
    };

    const resultado = await service.procesarWebhook(payloadWebhook);

    expect(resultado.exito).toBe(true);
    expect(resultado.estado_orden).toBe(EstadoOrden.EN_CAMINO);
    expect(resultado.numero_guia_coordinadora).toBe('7700987654321');
    expect(coordinadoraServiceMock.generarGuiaTransporte).toHaveBeenCalled();
  });
});
