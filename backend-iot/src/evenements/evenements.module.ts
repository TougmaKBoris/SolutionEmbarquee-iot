import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EvenementsController } from './evenements.controller';
import { EvenementsService } from './evenements.service';
import { Evenement, EvenementSchema } from './entities/evenement.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Evenement.name, schema: EvenementSchema }]),
  ],
  controllers: [EvenementsController],
  providers: [EvenementsService],
  exports: [EvenementsService],
})
export class EvenementsModule {}