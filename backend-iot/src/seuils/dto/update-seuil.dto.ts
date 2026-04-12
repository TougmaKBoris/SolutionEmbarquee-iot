import { IsNumber } from 'class-validator';

export class UpdateSeuilDto {
  @IsNumber()
  valeur_min: number;

  @IsNumber()
  valeur_max: number;
}
