import { IsNumber, IsOptional, Min } from 'class-validator';

/**
 * DTO para la actualización rápida de inventario de un producto
 */
export class ActualizarStockDto {
  @IsNumber({}, { message: 'El inventario debe ser un valor numérico' })
  @Min(0, { message: 'El inventario no puede ser negativo' })
  inventario_stock: number;

  @IsOptional()
  @IsNumber({}, { message: 'La alerta de stock mínimo debe ser un número' })
  @Min(0, { message: 'La alerta de stock no puede ser negativa' })
  alerta_stock_minimo?: number;
}
