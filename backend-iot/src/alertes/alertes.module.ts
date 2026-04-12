import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertesController } from './alertes.controller';
import { AlertesService } from './alertes.service';
import { Alerte, AlerteSchema } from './entities/alerte.entity';
import { EvenementsModule } from '../evenements/evenements.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Alerte.name, schema: AlerteSchema }]),EvenementsModule,],
  controllers: [AlertesController],
  providers: [AlertesService],
  exports: [AlertesService, MongooseModule],
  
})
export class AlertesModule {}
