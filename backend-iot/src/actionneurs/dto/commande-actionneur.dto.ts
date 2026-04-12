import { IsString, IsBoolean } from 'class-validator';

export class CommandeActionneurDto {
  @IsString()
  type: string;

  @IsBoolean()
  etat: boolean;
}
