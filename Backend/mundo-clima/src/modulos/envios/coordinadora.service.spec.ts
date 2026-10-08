import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CoordinadoraService } from './coordinadora.service';

describe('CoordinadoraService', () => {
  let service: CoordinadoraService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoordinadoraService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'COORDINADORA_CIUDAD_ORIGEN') return 'BOGOTA D.C.';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CoordinadoraService>(CoordinadoraService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe cotizar correctamente un envío para Bogotá (Local)', async () => {
    const cotizacion = await service.cotizarEnvio({
      departamento_destino: 'Cundinamarca',
      ciudad_destino: 'Bogotá D.C.',
      peso_total_kg: 2.0,
      valor_declarado: 100000,
    });

    expect(cotizacion.transportadora).toBe('Coordinadora Mercantil');
    expect(cotizacion.flete_base).toBe(10000);
    expect(cotizacion.costo_manejo).toBe(1000);
    expect(cotizacion.total_flete).toBe(11000);
    expect(cotizacion.dias_entrega_estimados).toBe(1);
  });

  it('debe cotizar un envío nacional con recargo de peso a Medellín', async () => {
    const cotizacion = await service.cotizarEnvio({
      departamento_destino: 'Antioquia',
      ciudad_destino: 'Medellín',
      peso_total_kg: 8.0, // 3kg adicionales
      valor_declarado: 200000,
    });

    // Flete base nacional $16.000 + (3 * $2.500 = $7.500) = $23.500 + Manejo ($2.000) = $25.500
    expect(cotizacion.flete_base).toBe(23500);
    expect(cotizacion.total_flete).toBe(25500);
  });

  it('debe generar una guía de transporte con número de prefijo 7700', async () => {
    const guia = await service.generarGuiaTransporte('MC-ORD-1001', {
      nombre: 'Taller HVAC Colombia',
      direccion: 'Calle 100 #15-20',
      ciudad: 'Cali',
      telefono: '3101234567',
    });

    expect(guia.numero_guia).toMatch(/^7700\d+/);
    expect(guia.url_rotulo_pdf).toContain(guia.numero_guia);
    expect(guia.estado).toBe('DESPACHADO');
  });
});
