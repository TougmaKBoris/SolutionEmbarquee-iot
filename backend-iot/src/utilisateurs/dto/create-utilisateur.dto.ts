import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';

export class CreateUtilisateurDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  mot_de_passe: string;

  @IsString()
  nom: string;

  @IsEnum(['responsable_maintenance', 'operateur'])
  role: string;
}
