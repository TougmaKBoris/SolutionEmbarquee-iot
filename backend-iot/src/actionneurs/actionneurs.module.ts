import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActionneursController } from './actionneurs.controller';
import { ActionneursService } from './actionneurs.service';
import { Actionneur, ActionneurSchema } from './entities/actionneur.entity';
import { Machine, MachineSchema } from '../machines/entities/machine.entity';
import { EvenementsModule } from '../evenements/evenements.module';
import { MqttModule } from '../mqtt/mqtt.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Actionneur.name, schema: ActionneurSchema },
      { name: Machine.name, schema: MachineSchema },
    ]),
    EvenementsModule,
    MqttModule,
  ],
  controllers: [ActionneursController],
  providers: [ActionneursService],
  exports: [ActionneursService, MongooseModule],
})
export class ActionneursModule {}

