import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MqttService } from './mqtt.service';
import { CapteurData, CapteurDataSchema } from '../capteurs/entities/capteur-data.entity';
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
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
