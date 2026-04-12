import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Seuil, SeuilDocument } from './entities/seuil.entity';
import { UpdateSeuilDto } from './dto/update-seuil.dto';

@Injectable()
export class SeuilsService {
  constructor(@InjectModel(Seuil.name) private seuilModel: Model<SeuilDocument>) {}

  async getByMachine(machineId: string) {
    return this.seuilModel.find({ machine_id: new Types.ObjectId(machineId) }).exec();
  }

  async update(machineId: string, typeCapteur: string, dto: UpdateSeuilDto) {
    return this.seuilModel.findOneAndUpdate(
      { machine_id: new Types.ObjectId(machineId), type_capteur: typeCapteur },
      { valeur_min: dto.valeur_min, valeur_max: dto.valeur_max },
      { new: true, upsert: true },
    ).exec();
  }
}
