import { IsString, IsArray, IsOptional, IsEnum, IsNumber, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CapteurConfigDto {
  @IsString()
  type: string;

  @IsString()
  unite: string;

  @IsNumber()
  valeur_min: number;

  @IsNumber()
  valeur_max: number;

  @IsString() @IsOptional()
  type_donnee?: string;
}

export class CreateMachineDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsArray() @IsOptional()
  capteurs?: string[];

  @IsArray() @IsOptional()
  actionneurs?: string[];

  @IsEnum(['en_ligne', 'hors_ligne']) @IsOptional()
  statut?: string;

  @IsArray() @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CapteurConfigDto)
  capteursConfig?: CapteurConfigDto[];

  @IsEnum(['simulation', 'mqtt']) @IsOptional()
  source?: string;
}
