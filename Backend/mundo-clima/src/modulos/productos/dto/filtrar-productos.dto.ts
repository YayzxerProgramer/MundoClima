import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { NivelCliente } from '../../../comun/enums/hvac.enums';

export enum OrdenarProductosPor {
  PRECIO_MENOR = 'precio_menor',
  PRECIO_MAYOR = 'precio_mayor',
  MAS_RECIENTES = 'mas_recientes',
  NOMBRE_AZ = 'nombre_az',
  DESTACADOS = 'destacados',
}

export class FiltrarProductosDto {
  @IsOptional()
  @IsString()
  q?: string; // Texto de búsqueda general (nombre, SKU, descripción)

  @IsOptional()
  @IsString()
  categoria?: string; // Slug o ID de la categoría

  @IsOptional()
  @IsString()
  marca?: string; // Slug o ID de la marca (soporta varias separadas por coma)

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioMinimo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioMaximo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  btu?: number;

  @IsOptional()
  @IsString()
  refrigerante?: string;

  @IsOptional()
  @IsString()
  voltaje?: string;

  @IsOptional()
  @IsString()
  tipoEquipo?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  soloConStock?: boolean;

  @IsOptional()
  @IsEnum(NivelCliente)
  nivelCliente?: NivelCliente = NivelCliente.CLIENTE_FINAL;

  @IsOptional()
  @IsEnum(OrdenarProductosPor)
  ordenarPor?: OrdenarProductosPor = OrdenarProductosPor.DESTACADOS;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pagina?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limite?: number = 12;
}
