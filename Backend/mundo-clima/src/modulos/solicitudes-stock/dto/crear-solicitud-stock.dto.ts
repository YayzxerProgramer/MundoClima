import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para el formulario "Déjanos tus datos / Contacto stock 0"
 */
export class CrearSolicitudStockDto {
  @IsString({ message: 'El identificador del producto es obligatorio' })
  producto_id: string;

  @IsString({ message: 'El nombre completo es obligatorio' })
  nombre_completo: string;

  @IsEmail({}, { message: 'Debes ingresar un correo electrónico válido' })
  email: string;

  @IsString({ message: 'El teléfono o número de WhatsApp es obligatorio' })
  telefono: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'La cantidad debe ser al menos 1 unidad' })
  cantidad?: number = 1;

  @IsOptional()
  @IsString()
  comentarios?: string;
}
