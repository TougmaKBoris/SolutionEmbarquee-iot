import { IsString, IsArray, IsOptional, IsEnum } from 'class-validator';

export class CreateMachineDto {
  @IsString()
  nom: string;

  @IsArray() @IsOptional()
  capteurs?: string[];

  @IsArray() @IsOptional()
  actionneurs?: string[];

  @IsEnum(['en_ligne', 'hors_ligne']) @IsOptional()
  statut?: string;
}
