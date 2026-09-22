/**
 * Roles de usuario del sistema y su mapa con niveles de precio B2B
 */
export enum RolUsuario {
  ADMIN = 'ADMIN',                 // Administrador del sistema (Acceso total)
  CLIENTE_FINAL = 'CLIENTE_FINAL', // Cliente Final - Precio Base de Venta (0% Descuento)
  TECNICO = 'TECNICO',             // Técnico / Taller HVAC - Descuento Profesional (10% por defecto)
  DISTRIBUIDOR = 'DISTRIBUIDOR',   // Mayorista / Distribuidor B2B - Precio Especial Mayorista (20% por defecto)
}

/**
 * Alias para mantener compatibilidad con NivelCliente
 */
export type NivelCliente = RolUsuario;
export const NivelCliente = RolUsuario;

/**
 * Descuentos porcentuales automáticos por defecto por cada nivel de cliente B2B
 */
export const DESCUENTOS_POR_DEFECTO_B2B: Record<RolUsuario, number> = {
  [RolUsuario.ADMIN]: 0,
  [RolUsuario.CLIENTE_FINAL]: 0,
  [RolUsuario.TECNICO]: 10,       // 10% de descuento automático
  [RolUsuario.DISTRIBUIDOR]: 20,  // 20% de descuento automático
};

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
