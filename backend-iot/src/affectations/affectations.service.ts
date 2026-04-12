import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Affectation, AffectationDocument } from './entities/affectation.entity';
import { CreateAffectationDto } from './dto/create-affectation.dto';

@Injectable()
export class AffectationsService {
  constructor(@InjectModel(Affectation.name) private affectationModel: Model<AffectationDocument>) {}

  async findAll() {
    return this.affectationModel.find().populate('operateur_id', 'nom email role').populate('machine_id', 'nom statut').exec();
  }

  async create(dto: CreateAffectationDto) {
    const operateurObjectId = new Types.ObjectId(dto.operateur_id);
    const machineObjectId = new Types.ObjectId(dto.machine_id);

    // Vérifier si l'opérateur est déjà affecté à CETTE machine (doublon exact)
    const doublon = await this.affectationModel.findOne({
      operateur_id: operateurObjectId,
      machine_id: machineObjectId,
    }).exec();
    if (doublon) {
      throw new ConflictException('Cet opérateur est déjà affecté à cette machine');
    }

    // Si l'opérateur est affecté à une autre machine, on supprime l'ancienne affectation (réaffectation automatique)
    await this.affectationModel.deleteMany({ operateur_id: operateurObjectId }).exec();

    // Créer la nouvelle affectation
    const affectation = await this.affectationModel.create({
      operateur_id: operateurObjectId,
      machine_id: machineObjectId,
    });
    return affectation.populate(['operateur_id', 'machine_id']);
  }

  async remove(id: string) {
    const result = await this.affectationModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Affectation non trouvée');
    return { message: 'Affectation supprimée' };
  }

  async getMaMachine(userId: string) {
    const affectation = await this.affectationModel.findOne({ operateur_id: new Types.ObjectId(userId) }).populate('machine_id', 'nom statut capteurs actionneurs').exec();
    if (!affectation) throw new NotFoundException('Aucune machine affectée');
    return affectation;
  }
}