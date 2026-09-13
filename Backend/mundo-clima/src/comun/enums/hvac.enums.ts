/**
 * Nivel o perfil del cliente para estrategia de precios B2B
 */
export enum NivelCliente {
  CLIENTE_FINAL = 'CLIENTE_FINAL', // Cliente Final - Precio Base de Venta
  TECNICO = 'TECNICO',             // Técnico / Taller HVAC - Descuento Profesional (~10-15%)
  DISTRIBUIDOR = 'DISTRIBUIDOR',   // Mayorista / Distribuidor B2B - Precio Especial Mayorista (~20-25%)
}

/**
 * Gases refrigerantes más comunes en el mercado colombiano de HVAC/R
 */
export enum RefrigeranteHvac {
  R410A = 'R-410A',
  R22 = 'R-22',
  R32 = 'R-32',
  R134A = 'R-134a',
  R404A = 'R-404A',
  R600A = 'R-600a',
}

/**
 * Voltajes y especificaciones eléctricas estándar
 */
export enum VoltajeHvac {
  V110 = '110V',
  V220_1PH = '220V 1Ph',
  V220_3PH = '220V 3Ph',
  V440_3PH = '440V 3Ph',
}

/**
 * Tipos de equipo HVAC/R
 */
export enum TipoEquipoHvac {
  MINI_SPLIT = 'Mini Split',
  MULTI_SPLIT = 'Multi Split',
  PISO_TECHO = 'Piso Techo',
  CASSETTE = 'Cassette',
  CHILLER = 'Chiller',
  VENTANA = 'Ventana',
  CENTRAL_PAQUETE = 'Central / Paquete',
  VRF = 'VRF / VRV',
}
