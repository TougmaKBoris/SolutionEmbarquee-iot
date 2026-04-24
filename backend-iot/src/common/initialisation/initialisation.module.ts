import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InitialisationService } from './initialisation.service';
import { Utilisateur, UtilisateurSchema } from '../../utilisateurs/entities/utilisateur.entity';
import { Machine, MachineSchema } from '../../machines/entities/machine.entity';
import { Seuil, SeuilSchema } from '../../seuils/entities/seuil.entity';
import { Actionneur, ActionneurSchema } from '../../actionneurs/entities/actionneur.entity';
import { Affectation, AffectationSchema } from '../../affectations/entities/affectation.entity';
import { MachineSupprimee, MachineSupprimeeSchema } from './machine-supprimee.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Utilisateur.name, schema: UtilisateurSchema },
      { name: Machine.name, schema: MachineSchema },
      { name: Seuil.name, schema: SeuilSchema },
      { name: Actionneur.name, schema: ActionneurSchema },
      { name: Affectation.name, schema: AffectationSchema },
      { name: MachineSupprimee.name, schema: MachineSupprimeeSchema },
    ]),
  ],
  providers: [InitialisationService],
  exports: [MongooseModule],
})
export class InitialisationModule {}