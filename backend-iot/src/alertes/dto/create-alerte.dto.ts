import { IsString, IsNumber, IsEnum } from 'class-validator';

export class CreateAlerteDto {
  @IsString()
  machine_id: string;

  @IsString()
  type_capteur: string;

  @IsNumber()
  valeur: number;

  @IsNumber()
  seuil_depasse: number;

  @IsEnum(['attention', 'critique'])
  niveau: string;

  @IsString()
  message: string;
}
