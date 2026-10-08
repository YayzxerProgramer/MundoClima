import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MetodoPago } from '../../../comun/enums/hvac.enums';

/**
 * DTO para la dirección de envío de la orden
 */
export class DireccionEnvioDto {
  @IsString()
  @IsNotEmpty()
  calle: string;

  @IsString()
  @IsNotEmpty()
  ciudad: string;

  @IsString()
  @IsNotEmpty()
  departamento: string;

  @IsString()
  @IsNotEmpty()
  telefono_contacto: string;
}

/**
 * DTO para cada ítem solicitado en la orden
 */
export class ItemOrdenCrearDto {
  @IsUUID()
  @IsNotEmpty()
  producto_id: string;

  @IsInt()
  @Min(1)
  cantidad: number;
}

/**
 * DTO para la creación de una nueva orden de compra
 */
export class CrearOrdenDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemOrdenCrearDto)
  items: ItemOrdenCrearDto[];

  @IsEnum(MetodoPago)
  metodo_pago: MetodoPago;

  @ValidateNested()
  @Type(() => DireccionEnvioDto)
  direccion_envio: DireccionEnvioDto;
}
