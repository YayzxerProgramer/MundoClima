import { IsString, IsOptional } from 'class-validator';

/**
 * DTO para asignar o actualizar número de guía de transporte en una orden
 */
export class AsignarGuiaOrdenDto {
  @IsString({ message: 'El número de guía de transporte es obligatorio' })
  coordinadora_numero_guia: string;

  @IsOptional()
  @IsString()
  coordinadora_estado_envio?: string;

  @IsOptional()
  @IsString()
  coordinadora_rotulo_pdf?: string;
}
