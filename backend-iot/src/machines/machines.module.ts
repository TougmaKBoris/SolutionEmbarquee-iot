import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MachinesController } from './machines.controller';
import { MachinesService } from './machines.service';
import { Machine, MachineSchema } from './entities/machine.entity';
import { Actionneur, ActionneurSchema } from '../actionneurs/entities/actionneur.entity';
import { Seuil, SeuilSchema } from '../seuils/entities/seuil.entity';
import { Alerte, AlerteSchema } from '../alertes/entities/alerte.entity';
import { Affectation, AffectationSchema } from '../affectations/entities/affectation.entity';
import { CapteurData, CapteurDataSchema } from '../capteurs/entities/capteur-data.entity';
import { Evenement, EvenementSchema } from '../evenements/entities/evenement.entity';
import { EvenementsModule } from '../evenements/evenements.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Machine.name, schema: MachineSchema },
      { name: Actionneur.name, schema: ActionneurSchema },
      { name: Seuil.name, schema: SeuilSchema },
      { name: Alerte.name, schema: AlerteSchema },
      { name: Affectation.name, schema: AffectationSchema },
      { name: CapteurData.name, schema: CapteurDataSchema },
      { name: Evenement.name, schema: EvenementSchema },
    ]),
    EvenementsModule,
  ],
  controllers: [MachinesController],
  providers: [MachinesService],
  exports: [MachinesService],
})
export class MachinesModule {}