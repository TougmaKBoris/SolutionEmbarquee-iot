import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Actionneur, ActionneurDocument } from './entities/actionneur.entity';
import { CommandeActionneurDto } from './dto/commande-actionneur.dto';
import { Machine, MachineDocument } from '../machines/entities/machine.entity';

@Injectable()
export class ActionneursService {
  constructor(
    @InjectModel(Actionneur.name) private actionneurModel: Model<ActionneurDocument>,
    @InjectModel(Machine.name) private machineModel: Model<MachineDocument>,
  ) {}

  async getByMachine(machineId: string) {
    return this.actionneurModel.find({ machine_id: new Types.ObjectId(machineId) }).exec();
  }

  async commande(machineId: string, dto: CommandeActionneurDto) {
    // Verifier l'etat de la machine avant d'autoriser la commande
    const machine = await this.machineModel.findById(machineId).exec();
    if (!machine) throw new NotFoundException('Machine non trouvee');

    if (machine.etat === 'arretee') {
      throw new ForbiddenException("Commande impossible : la machine est arretee. Redemarrez-la d'abord.");
    }

    if (machine.mode === 'auto') {
      throw new ForbiddenException('Commande impossible : la machine est en mode automatique. Passez en mode manuel pour la controler.');
    }

    return this.actionneurModel.findOneAndUpdate(
      { machine_id: new Types.ObjectId(machineId), type: dto.type },
      { etat: dto.etat, derniere_commande: new Date() },
      { new: true, upsert: true },
    ).exec();
  }
}