import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CapteursController } from './capteurs.controller';
import { CapteursService } from './capteurs.service';
import { CapteurData, CapteurDataSchema } from './entities/capteur-data.entity';
import { Machine, MachineSchema } from '../machines/entities/machine.entity';
import { Alerte, AlerteSchema } from '../alertes/entities/alerte.entity';
import { Seuil, SeuilSchema } from '../seuils/entities/seuil.entity';
import { EmailsModule } from '../emails/emails.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CapteurData.name, schema: CapteurDataSchema },
      { name: Machine.name, schema: MachineSchema },
      { name: Alerte.name, schema: AlerteSchema },
      { name: Seuil.name, schema: SeuilSchema },
    ]),
    EmailsModule,
  ],
  controllers: [CapteursController],
  providers: [CapteursService],
  exports: [CapteursService],
})
export class CapteursModule {}