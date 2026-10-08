import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

/**
 * DTO para consultar la cotización de flete con Coordinadora Mercantil
 */
export class CotizarEnvioDto {
  @IsString()
  @IsNotEmpty()
  departamento_destino: string;

  @IsString()
  @IsNotEmpty()
  ciudad_destino: string;

  @IsNumber()
  @Min(0.1)
  peso_total_kg: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  valor_declarado?: number;
}
