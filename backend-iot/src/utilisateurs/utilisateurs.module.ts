import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UtilisateursController } from './utilisateurs.controller';
import { UtilisateursService } from './utilisateurs.service';
import { Utilisateur, UtilisateurSchema } from './entities/utilisateur.entity';
import { Affectation, AffectationSchema } from '../affectations/entities/affectation.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Utilisateur.name, schema: UtilisateurSchema },
      { name: Affectation.name, schema: AffectationSchema },
    ]),
  ],
  controllers: [UtilisateursController],
  providers: [UtilisateursService],
  exports: [UtilisateursService],
})
export class UtilisateursModule {}