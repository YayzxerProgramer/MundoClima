import { IsArray, ArrayMinSize, ArrayMaxSize, IsString } from 'class-validator';

/**
 * DTO para comparar hasta 4 productos HVAC/R por sus IDs o Slugs
 */
export class CompararProductosDto {
  @IsArray({ message: 'Los identificadores deben ser un arreglo de cadenas' })
  @ArrayMinSize(1, { message: 'Debes enviar al menos 1 producto para comparar' })
  @ArrayMaxSize(4, { message: 'Solo se pueden comparar un máximo de 4 productos a la vez' })
  @IsString({ each: true, message: 'Cada identificador debe ser una cadena válida' })
  ids: string[];
}
