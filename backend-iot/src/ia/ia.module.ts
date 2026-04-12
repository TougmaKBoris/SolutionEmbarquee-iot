import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IaController } from './ia.controller';
import { IaService } from './ia.service';
import { Alerte, AlerteSchema } from '../alertes/entities/alerte.entity';
import { CapteurData, CapteurDataSchema } from '../capteurs/entities/capteur-data.entity';
import { Machine, MachineSchema } from '../machines/entities/machine.entity';
import { Seuil, SeuilSchema } from '../seuils/entities/seuil.entity';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Alerte.name, schema: AlerteSchema },
    { name: CapteurData.name, schema: CapteurDataSchema },
    { name: Machine.name, schema: MachineSchema },
    { name: Seuil.name, schema: SeuilSchema },
  ])],
  controllers: [IaController],
  providers: [IaService],
})
export class IaModule {}