import { IsString } from 'class-validator';

export class CreateAffectationDto {
  @IsString()
  operateur_id: string;

  @IsString()
  machine_id: string;
}
