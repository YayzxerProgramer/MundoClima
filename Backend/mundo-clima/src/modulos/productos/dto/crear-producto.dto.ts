import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CrearPrecioNivelDto {
  @IsString()
  nivel_cliente: string;

  @IsNumber()
  @Min(1)
  cantidad_minima: number;

  @IsNumber()
  @Min(0)
  precio_especial: number;
}

export class CrearProductoDto {
  @IsString()
  sku: string;

  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  descripcion_corta?: string;

  @IsNumber()
  @Min(0)
  precio_base: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precio_costo?: number;

  @IsNumber()
  @Min(0)
  inventario_stock: number;

  @IsOptional()
  @IsNumber()
  alerta_stock_minimo?: number;

  @IsOptional()
  @IsString()
  unidad_medida?: string;

  @IsOptional()
  @IsBoolean()
  esta_activo?: boolean;

  @IsOptional()
  @IsBoolean()
  es_destacado?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagenes?: string[];

  // Campos técnicos HVAC/R
  @IsOptional()
  @IsNumber()
  btu?: number;

  @IsOptional()
  @IsString()
  tipo_refrigerante?: string;

  @IsOptional()
  @IsString()
  voltaje?: string;

  @IsOptional()
  @IsString()
  tipo_equipo?: string;

  @IsOptional()
  @IsObject()
  especificaciones?: Record<string, string | number>;

  @IsOptional()
  @IsString()
  categoria_id?: string;

  @IsOptional()
  @IsString()
  marca_id?: string;

  @IsOptional()
  @IsArray()
  @Type(() => CrearPrecioNivelDto)
  precios_nivel?: CrearPrecioNivelDto[];
}
