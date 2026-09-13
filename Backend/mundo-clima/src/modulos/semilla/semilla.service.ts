import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from '../categorias/entidades/categoria.entity';
import { Marca } from '../marcas/entidades/marca.entity';
import { Producto } from '../productos/entidades/producto.entity';
import { PrecioNivelCliente } from '../productos/entidades/precio-nivel-cliente.entity';
import {
  NivelCliente,
  TipoEquipoHvac,
  RefrigeranteHvac,
  VoltajeHvac,
} from '../../comun/enums/hvac.enums';

@Injectable()
export class SemillaService {
  private readonly registrador = new Logger(SemillaService.name);

  constructor(
    @InjectRepository(Categoria)
    private readonly repositorioCategoria: Repository<Categoria>,
    @InjectRepository(Marca)
    private readonly repositorioMarca: Repository<Marca>,
    @InjectRepository(Producto)
    private readonly repositorioProducto: Repository<Producto>,
    @InjectRepository(PrecioNivelCliente)
    private readonly repositorioPrecioNivel: Repository<PrecioNivelCliente>,
  ) {}

  async ejecutarSemilla(): Promise<{ mensaje: string; conteos: any }> {
    this.registrador.log('Iniciando proceso de poblamiento de datos para Mundo Clima...');

    // Limpiar tablas existentes en orden de dependencia
    await this.repositorioPrecioNivel.createQueryBuilder().delete().execute();
    await this.repositorioProducto.createQueryBuilder().delete().execute();
    await this.repositorioMarca.createQueryBuilder().delete().execute();
    await this.repositorioCategoria.createQueryBuilder().delete().execute();

    // 1. Insertar Marcas
    const datosMarcas = [
      { nombre: 'Copeland', slug: 'copeland', logo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200' },
      { nombre: 'Danfoss', slug: 'danfoss', logo_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=200' },
      { nombre: 'LG', slug: 'lg', logo_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=200' },
      { nombre: 'Carrier', slug: 'carrier', logo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200' },
      { nombre: 'Trane', slug: 'trane', logo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200' },
      { nombre: 'Errecom', slug: 'errecom', logo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200' },
      { nombre: 'Yellow Jacket', slug: 'yellow-jacket', logo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200' },
      { nombre: 'Universal', slug: 'universal', logo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200' },
    ];
    const marcasGuardadas = await this.repositorioMarca.save(
      datosMarcas.map((m) => this.repositorioMarca.create(m)),
    );
    const mapaMarcas = new Map(marcasGuardadas.map((m) => [m.slug, m]));

    // 2. Insertar Categorías
    const datosCategorias = [
      { nombre: 'Aires Acondicionados', slug: 'aires-acondicionados', descripcion: 'Equipos completos de aire acondicionado residencial y comercial' },
      { nombre: 'Compresores', slug: 'compresores', descripcion: 'Compresores herméticos y scroll para refrigeración y clima' },
      { nombre: 'Gases Refrigerantes', slug: 'gases-refrigerantes', description: 'Refrigerantes R410A, R22, R32, R134a y más' },
      { nombre: 'Componentes Eléctricos', slug: 'componentes-electricos', description: 'Capacitores, contactores, relés y tarjetas electrónicas' },
      { nombre: 'Válvulas y Controles', slug: 'valvulas-y-controles', description: 'Válvulas de expansión, solenoides y termostatos' },
      { nombre: 'Tubería y Aislamiento', slug: 'tuberia-y-aislamiento', description: 'Tubería de cobre, aislante térmico y racores' },
      { nombre: 'Herramientas de Refrigeración', slug: 'herramientas', description: 'Manifolds, bombas de vacío y abocinadores' },
    ];
    const categoriasGuardadas = await this.repositorioCategoria.save(
      datosCategorias.map((c) => this.repositorioCategoria.create(c)),
    );
    const mapaCategorias = new Map(categoriasGuardadas.map((c) => [c.slug, c]));

    // 3. Insertar Productos con especificaciones HVAC/R y precios B2B por perfil
    const datosProductos = [
      {
        sku: 'COMP-COP-36K-220V',
        nombre: 'Compresor Scroll Copeland 36.000 BTU 220V R410A',
        slug: 'compresor-scroll-copeland-36000-btu-220v-r410a',
        descripcion: 'Compresor scroll de alta eficiencia para aire acondicionado residencial y comercial liviano.',
        descripcion_corta: 'Compresor Scroll 36.000 BTU 220V 1Ph R410A',
        precio_base: 1850000,
        precio_costo: 1350000,
        inventario_stock: 12,
        es_destacado: true,
        unidad_medida: 'Unidad',
        imagenes: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600'],
        btu: 36000,
        tipo_refrigerante: RefrigeranteHvac.R410A,
        voltaje: VoltajeHvac.V220_1PH,
        tipo_equipo: TipoEquipoHvac.PISO_TECHO,
        especificaciones: { 'Potencia HP': '3.0 HP', 'Desplazamiento': '52 cm3/rev', 'Garantía': '12 Meses' },
        categoria: mapaCategorias.get('compresores'),
        marca: mapaMarcas.get('copeland'),
        precios_nivel: [
          { nivel_cliente: NivelCliente.TECNICO, cantidad_minima: 1, precio_especial: 1650000 },
          { nivel_cliente: NivelCliente.DISTRIBUIDOR, cantidad_minima: 1, precio_especial: 1500000 },
        ],
      },
      {
        sku: 'COMP-DAN-12K-110V',
        nombre: 'Compresor Hermético Danfoss 12.000 BTU 110V R22',
        slug: 'compresor-hermetico-danfoss-12000-btu-110v-r22',
        descripcion: 'Compresor recíproco de alta calidad Danfoss ideal para aires de ventana y mini splits de 12K BTU.',
        descripcion_corta: 'Compresor Danfoss 12.000 BTU 110V R22',
        precio_base: 780000,
        precio_costo: 550000,
        inventario_stock: 25,
        es_destacado: true,
        unidad_medida: 'Unidad',
        imagenes: ['https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600'],
        btu: 12000,
        tipo_refrigerante: RefrigeranteHvac.R22,
        voltaje: VoltajeHvac.V110,
        tipo_equipo: TipoEquipoHvac.MINI_SPLIT,
        especificaciones: { 'Potencia HP': '1.0 HP', 'Frecuencia': '60 Hz' },
        categoria: mapaCategorias.get('compresores'),
        marca: mapaMarcas.get('danfoss'),
        precios_nivel: [
          { nivel_cliente: NivelCliente.TECNICO, cantidad_minima: 1, precio_especial: 700000 },
          { nivel_cliente: NivelCliente.DISTRIBUIDOR, cantidad_minima: 1, precio_especial: 620000 },
        ],
      },
      {
        sku: 'GAS-R410A-11.3KG',
        nombre: 'Cilindro Gas Refrigerante R410A 11.3 Kg (25 lb)',
        slug: 'cilindro-gas-refrigerante-r410a-11-3kg',
        descripcion: 'Gas refrigerante ecológico HFC no agotador de la capa de ozono en presentación de 11.3 kg.',
        descripcion_corta: 'Cilindro Gas R410A 11.3 Kg marca Errecom/Genérico',
        precio_base: 280000,
        precio_costo: 190000,
        inventario_stock: 50,
        es_destacado: true,
        unidad_medida: 'Cilindro',
        imagenes: ['https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600'],
        btu: null,
        tipo_refrigerante: RefrigeranteHvac.R410A,
        voltaje: null,
        tipo_equipo: null,
        especificaciones: { 'Peso Neto': '11.3 Kg / 25 lbs', 'Pureza': '99.9%' },
        categoria: mapaCategorias.get('gases-refrigerantes'),
        marca: mapaMarcas.get('errecom'),
        precios_nivel: [
          { nivel_cliente: NivelCliente.TECNICO, cantidad_minima: 1, precio_especial: 250000 },
          { nivel_cliente: NivelCliente.DISTRIBUIDOR, cantidad_minima: 1, precio_especial: 220000 },
        ],
      },
      {
        sku: 'GAS-R32-9.5KG',
        nombre: 'Cilindro Gas Refrigerante R32 9.5 Kg Ecofriendly',
        slug: 'cilindro-gas-refrigerante-r32-9-5kg',
        descripcion: 'Refrigerante R32 ecológico de última generación para sistemas Inverter.',
        descripcion_corta: 'Cilindro Gas R32 9.5 Kg',
        precio_base: 320000,
        precio_costo: 220000,
        inventario_stock: 30,
        es_destacado: false,
        unidad_medida: 'Cilindro',
        imagenes: ['https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=600'],
        tipo_refrigerante: RefrigeranteHvac.R32,
        categoria: mapaCategorias.get('gases-refrigerantes'),
        marca: mapaMarcas.get('errecom'),
        precios_nivel: [
          { nivel_cliente: NivelCliente.TECNICO, cantidad_minima: 1, precio_especial: 290000 },
          { nivel_cliente: NivelCliente.DISTRIBUIDOR, cantidad_minima: 1, precio_especial: 260000 },
        ],
      },
      {
        sku: 'CAP-LG-35-5-440V',
        nombre: 'Capacitor Dual de Marcha 35+5 uF 440V LG',
        slug: 'capacitor-dual-35-5-uf-440v-lg',
        descripcion: 'Capacitor dual de aluminio sumergido en aceite dieléctrico para arranque y marcha.',
        descripcion_corta: 'Capacitor Dual 35/5 MFD 440VAC',
        precio_base: 38000,
        precio_costo: 20000,
        inventario_stock: 100,
        es_destacado: false,
        unidad_medida: 'Unidad',
        imagenes: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600'],
        voltaje: VoltajeHvac.V440_3PH,
        tipo_equipo: TipoEquipoHvac.MINI_SPLIT,
        especificaciones: { 'Capacitancia': '35 + 5 uF ±5%', 'Voltaje': '440 VAC' },
        categoria: mapaCategorias.get('componentes-electricos'),
        marca: mapaMarcas.get('lg'),
        precios_nivel: [
          { nivel_cliente: NivelCliente.TECNICO, cantidad_minima: 1, precio_especial: 30000 },
          { nivel_cliente: NivelCliente.DISTRIBUIDOR, cantidad_minima: 1, precio_especial: 25000 },
        ],
      },
      {
        sku: 'CONT-CAR-30A-220V',
        nombre: 'Contactor Magnético 30A 2 Polos Bobina 220V Carrier',
        slug: 'contactor-magnetico-30a-2-polos-bobina-220v-carrier',
        descripcion: 'Contactor de potencia de 30 Amperios con bobina de 220V para condensadoras.',
        descripcion_corta: 'Contactor 30A 2 Polos 220VAC',
        precio_base: 65000,
        precio_costo: 38000,
        inventario_stock: 45,
        es_destacado: false,
        unidad_medida: 'Unidad',
        imagenes: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600'],
        voltaje: VoltajeHvac.V220_1PH,
        categoria: mapaCategorias.get('componentes-electricos'),
        marca: mapaMarcas.get('carrier'),
        precios_nivel: [
          { nivel_cliente: NivelCliente.TECNICO, cantidad_minima: 1, precio_especial: 55000 },
          { nivel_cliente: NivelCliente.DISTRIBUIDOR, cantidad_minima: 1, precio_especial: 48000 },
        ],
      },
      {
        sku: 'VALV-DAN-TEX2-R410A',
        nombre: 'Válvula de Expansión Termostática Danfoss TEX 2 R410A',
        slug: 'valvula-expansion-termostatica-danfoss-tex2-r410a',
        descripcion: 'Válvula de expansión de ecualización externa para flujo preciso de refrigerante R410A.',
        descripcion_corta: 'Válvula Expansión Danfoss TEX 2 R410A',
        precio_base: 215000,
        precio_costo: 145000,
        inventario_stock: 18,
        es_destacado: false,
        unidad_medida: 'Unidad',
        imagenes: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600'],
        tipo_refrigerante: RefrigeranteHvac.R410A,
        categoria: mapaCategorias.get('valvulas-y-controles'),
        marca: mapaMarcas.get('danfoss'),
        precios_nivel: [
          { nivel_cliente: NivelCliente.TECNICO, cantidad_minima: 1, precio_especial: 190000 },
          { nivel_cliente: NivelCliente.DISTRIBUIDOR, cantidad_minima: 1, precio_especial: 170000 },
        ],
      },
      {
        sku: 'PCB-UNI-MINISPLIT',
        nombre: 'Tarjeta Electrónica Universal para Mini Split con Control',
        slug: 'tarjeta-electronica-universal-mini-split-control',
        descripcion: 'Tarjeta de reemplazo universal para unidades Mini Split con display y control remoto.',
        descripcion_corta: 'Kit Tarjeta Universal Mini Split + Control Remoto',
        precio_base: 85000,
        precio_costo: 48000,
        inventario_stock: 60,
        es_destacado: true,
        unidad_medida: 'Juego',
        imagenes: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600'],
        voltaje: VoltajeHvac.V220_1PH,
        tipo_equipo: TipoEquipoHvac.MINI_SPLIT,
        categoria: mapaCategorias.get('componentes-electricos'),
        marca: mapaMarcas.get('universal'),
        precios_nivel: [
          { nivel_cliente: NivelCliente.TECNICO, cantidad_minima: 1, precio_especial: 72000 },
          { nivel_cliente: NivelCliente.DISTRIBUIDOR, cantidad_minima: 1, precio_especial: 62000 },
        ],
      },
      {
        sku: 'HERR-YJ-MANIFOLD-DIG',
        nombre: 'Manifold Digital de 2 Vías con Mangueras Yellow Jacket',
        slug: 'manifold-digital-2-vias-mangueras-yellow-jacket',
        descripcion: 'Manifold digital profesional con cálculo automático de sobrecalentamiento y subenfriamiento.',
        descripcion_corta: 'Manifold Digital Yellow Jacket 2 Vías',
        precio_base: 1450000,
        precio_costo: 1050000,
        inventario_stock: 8,
        es_destacado: true,
        unidad_medida: 'Juego',
        imagenes: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600'],
        categoria: mapaCategorias.get('herramientas'),
        marca: mapaMarcas.get('yellow-jacket'),
        precios_nivel: [
          { nivel_cliente: NivelCliente.TECNICO, cantidad_minima: 1, precio_especial: 1320000 },
          { nivel_cliente: NivelCliente.DISTRIBUIDOR, cantidad_minima: 1, precio_especial: 1200000 },
        ],
      },
      {
        sku: 'HERR-VAC-6CFM-2STAGE',
        nombre: 'Bomba de Vacío 6 CFM 2 Etapas 110V/220V Dual Voltage',
        slug: 'bomba-de-vacio-6-cfm-2-etapas-dual-voltage',
        descripcion: 'Bomba de vacío de alta resistencia para deshidratación profunda de sistemas HVAC/R.',
        descripcion_corta: 'Bomba de Vacío 6 CFM 2 Etapas',
        precio_base: 980000,
        precio_costo: 680000,
        inventario_stock: 14,
        es_destacado: false,
        unidad_medida: 'Unidad',
        imagenes: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600'],
        voltaje: VoltajeHvac.V110,
        categoria: mapaCategorias.get('herramientas'),
        marca: mapaMarcas.get('yellow-jacket'),
        precios_nivel: [
          { nivel_cliente: NivelCliente.TECNICO, cantidad_minima: 1, precio_especial: 880000 },
          { nivel_cliente: NivelCliente.DISTRIBUIDOR, cantidad_minima: 1, precio_especial: 800000 },
        ],
      },
      {
        sku: 'TUB-COB-14-15M',
        nombre: 'Rollo Tubería de Cobre Flexible 1/4" x 15 Metros',
        slug: 'rollo-tuberia-cobre-flexible-1-4-x-15m',
        descripcion: 'Tubería de cobre desoxidado de alta pureza sin costura para instalaciones frigoríficas.',
        descripcion_corta: 'Rollo Tubería Cobre 1/4" 15 Metros',
        precio_base: 140000,
        precio_costo: 95000,
        inventario_stock: 40,
        es_destacado: false,
        unidad_medida: 'Rollo',
        imagenes: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600'],
        especificaciones: { 'Diámetro': '1/4 pulgada', 'Longitud': '15 Metros' },
        categoria: mapaCategorias.get('tuberia-y-aislamiento'),
        marca: mapaMarcas.get('universal'),
        precios_nivel: [
          { nivel_cliente: NivelCliente.TECNICO, cantidad_minima: 1, precio_especial: 120000 },
          { nivel_cliente: NivelCliente.DISTRIBUIDOR, cantidad_minima: 1, precio_especial: 105000 },
        ],
      },
      {
        sku: 'EQUIP-LG-12K-INV',
        nombre: 'Aire Acondicionado Mini Split Inverter 12.000 BTU 220V LG DualCool',
        slug: 'aire-acondicionado-mini-split-inverter-12000-btu-220v-lg-dualcool',
        descripcion: 'Unidad de aire acondicionado completa (evaporador + condensador) con tecnología Dual Inverter.',
        descripcion_corta: 'Mini Split LG Dual Inverter 12.000 BTU 220V',
        precio_base: 1950000,
        precio_costo: 1550000,
        inventario_stock: 10,
        es_destacado: true,
        unidad_medida: 'Unidad',
        imagenes: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600'],
        btu: 12000,
        tipo_refrigerante: RefrigeranteHvac.R410A,
        voltaje: VoltajeHvac.V220_1PH,
        tipo_equipo: TipoEquipoHvac.MINI_SPLIT,
        especificaciones: { 'SEER': '18 SEER', 'Wi-Fi': 'ThinQ Integrado' },
        categoria: mapaCategorias.get('aires-acondicionados'),
        marca: mapaMarcas.get('lg'),
        precios_nivel: [
          { nivel_cliente: NivelCliente.TECNICO, cantidad_minima: 1, precio_especial: 1800000 },
          { nivel_cliente: NivelCliente.DISTRIBUIDOR, cantidad_minima: 1, precio_especial: 1680000 },
        ],
      },
      {
        sku: 'EQUIP-CAR-60K-PT-3PH',
        nombre: 'Aire Acondicionado Piso Techo 60.000 BTU 220V 3Ph Carrier',
        slug: 'aire-acondicionado-piso-techo-60000-btu-220v-3ph-carrier',
        descripcion: 'Equipo comercial pesado Piso Techo Carrier de 5 Toneladas de refrigeración (60K BTU).',
        descripcion_corta: 'Piso Techo Carrier 60.000 BTU 5 TR 220V 3Ph',
        precio_base: 6800000,
        precio_costo: 5200000,
        inventario_stock: 4,
        es_destacado: true,
        unidad_medida: 'Unidad',
        imagenes: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600'],
        btu: 60000,
        tipo_refrigerante: RefrigeranteHvac.R410A,
        voltaje: VoltajeHvac.V220_3PH,
        tipo_equipo: TipoEquipoHvac.PISO_TECHO,
        especificaciones: { 'Capacidad TR': '5.0 TR', 'Tipo Eléctrico': 'Trifásico 220V' },
        categoria: mapaCategorias.get('aires-acondicionados'),
        marca: mapaMarcas.get('carrier'),
        precios_nivel: [
          { nivel_cliente: NivelCliente.TECNICO, cantidad_minima: 1, precio_especial: 6200000 },
          { nivel_cliente: NivelCliente.DISTRIBUIDOR, cantidad_minima: 1, precio_especial: 5700000 },
        ],
      },
    ];

    let conteoProductosSembrados = 0;
    let conteoPreciosSembrados = 0;

    for (const p of datosProductos) {
      const { precios_nivel, ...camposProducto } = p;
      const prodCreado = this.repositorioProducto.create(camposProducto);
      const prodGuardado = await this.repositorioProducto.save(prodCreado);
      conteoProductosSembrados++;

      if (precios_nivel && precios_nivel.length > 0) {
        for (const pn of precios_nivel) {
          const entidadPrecioNivel = this.repositorioPrecioNivel.create({
            producto_id: prodGuardado.id,
            nivel_cliente: pn.nivel_cliente,
            cantidad_minima: pn.cantidad_minima,
            precio_especial: pn.precio_especial,
          });
          await this.repositorioPrecioNivel.save(entidadPrecioNivel);
          conteoPreciosSembrados++;
        }
      }
    }

    this.registrador.log('¡Semilla completada exitosamente!');

    return {
      mensaje: 'Base de datos poblada exitosamente con productos HVAC/R de prueba en español',
      conteos: {
        categorias: categoriasGuardadas.length,
        marcas: marcasGuardadas.length,
        productos: conteoProductosSembrados,
        precios_nivel_b2b: conteoPreciosSembrados,
      },
    };
  }
}
