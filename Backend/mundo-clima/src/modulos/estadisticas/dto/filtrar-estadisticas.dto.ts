import { IsOptional, IsString } from 'class-validator';

export class FiltrarEstadisticasDto {
  @IsOptional()
  @IsString()
  rango?: string = 'mes';

  @IsOptional()
  @IsString()
  desde?: string;

  @IsOptional()
  @IsString()
  hasta?: string;
}

