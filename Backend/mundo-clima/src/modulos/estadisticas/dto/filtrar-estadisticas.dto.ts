import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator';

export class FiltrarEstadisticasDto {
  @IsOptional()
  @IsString()
  @IsIn(['hoy', 'semana', 'mes', 'ano', 'personalizado'])
  rango?: 'hoy' | 'semana' | 'mes' | 'ano' | 'personalizado' = 'mes';

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;
}
