import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EstadisticasService } from './estadisticas.service';
import { Orden } from '../ordenes/entidades/orden.entity';
import { Producto } from '../productos/entidades/producto.entity';
import { Usuario } from '../usuarios/entidades/usuario.entity';
import { VisitaTienda } from './entidades/visita-tienda.entity';
import { RolUsuario } from '../../comun/enums/hvac.enums';

describe('EstadisticasService', () => {
  let service: EstadisticasService;
  let ordenRepositoryMock: any;
  let productoRepositoryMock: any;
  let usuarioRepositoryMock: any;
  let visitaRepositoryMock: any;

  beforeEach(async () => {
    ordenRepositoryMock = {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total_ventas: '48500000', conteo_ordenes: '10' }),
        getRawMany: jest.fn().mockResolvedValue([
          { estado: 'PAGADO', conteo: '6' },
          { estado: 'EN_CAMINO', conteo: '4' },
        ]),
      }),
      count: jest.fn().mockResolvedValue(10),
    };

    productoRepositoryMock = {
      count: jest.fn().mockResolvedValue(50),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ valor_total: '125000000' }),
        getMany: jest.fn().mockResolvedValue([]),
      }),
    };

    usuarioRepositoryMock = {
      count: jest.fn().mockImplementation(({ where }: any = {}) => {
        if (!where) return Promise.resolve(100);
        if (where.rol === RolUsuario.CLIENTE_FINAL) return Promise.resolve(60);
        if (where.rol === RolUsuario.TECNICO) return Promise.resolve(30);
        if (where.rol === RolUsuario.DISTRIBUIDOR) return Promise.resolve(10);
        return Promise.resolve(0);
      }),
    };

    visitaRepositoryMock = {
      create: jest.fn((dto) => dto),
      save: jest.fn((visita) => Promise.resolve({ id: 'uuid-visita-1', ...visita })),
      count: jest.fn().mockResolvedValue(500),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstadisticasService,
        { provide: getRepositoryToken(Orden), useValue: ordenRepositoryMock },
        { provide: getRepositoryToken(Producto), useValue: productoRepositoryMock },
        { provide: getRepositoryToken(Usuario), useValue: usuarioRepositoryMock },
        { provide: getRepositoryToken(VisitaTienda), useValue: visitaRepositoryMock },
      ],
    }).compile();

    service = module.get<EstadisticasService>(EstadisticasService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe calcular el resumen general de KPIs de ventas y clientes', async () => {
    const resumen = await service.obtenerResumenGeneral();

    expect(resumen.ventas_totales_cop).toBe(48500000);
    expect(resumen.ordenes_aprobadas_conteo).toBe(10);
    expect(resumen.ticket_promedio_cop).toBe(4850000);
    expect(resumen.clientes.total_registrados).toBe(100);
    expect(resumen.clientes.tecnicos_profesionales).toBe(30);
    expect(resumen.clientes.distribuidores_mayoristas).toBe(10);
  });

  it('debe calcular correctamente la tasa de conversión', async () => {
    const conversion = await service.obtenerMetricasConversion();

    expect(conversion.total_visitas_registradas).toBe(500);
    expect(conversion.ordenes_completadas).toBe(10);
    expect(conversion.tasa_conversion_porcentaje).toBe(2); // (10 / 500) * 100 = 2%
  });
});
