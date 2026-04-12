import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeuilsController } from './seuils.controller';
import { SeuilsService } from './seuils.service';
import { Seuil, SeuilSchema } from './entities/seuil.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: Seuil.name, schema: SeuilSchema }])],
  controllers: [SeuilsController],
  providers: [SeuilsService],
  exports: [SeuilsService, MongooseModule],
})
export class SeuilsModule {}
