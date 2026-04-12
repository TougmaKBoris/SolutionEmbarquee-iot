import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Utilisateur, UtilisateurDocument } from './entities/utilisateur.entity';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto';
import { Affectation, AffectationDocument } from '../affectations/entities/affectation.entity';

@Injectable()
export class UtilisateursService {
  constructor(
    @InjectModel(Utilisateur.name) private utilisateurModel: Model<UtilisateurDocument>,
    @InjectModel(Affectation.name) private affectationModel: Model<AffectationDocument>,
  ) {}

  async findAll() { return this.utilisateurModel.find().select('-mot_de_passe').exec(); }

  async findOne(id: string) {
    const user = await this.utilisateurModel.findById(id).select('-mot_de_passe').exec();
    if (!user) throw new NotFoundException('Utilisateur non trouve');
    return user;
  }

  async create(dto: CreateUtilisateurDto) {
    const hash = await bcrypt.hash(dto.mot_de_passe, 10);
    return this.utilisateurModel.create({ ...dto, mot_de_passe: hash });
  }

  async update(id: string, dto: UpdateUtilisateurDto) {
    if (dto.mot_de_passe) dto.mot_de_passe = await bcrypt.hash(dto.mot_de_passe, 10);
    const user = await this.utilisateurModel.findByIdAndUpdate(id, dto, { new: true }).select('-mot_de_passe').exec();
    if (!user) throw new NotFoundException('Utilisateur non trouve');
    return user;
  }

  async remove(id: string) {
    const user = await this.utilisateurModel.findById(id).exec();
    if (!user) throw new NotFoundException('Utilisateur non trouve');
    if (user.role === 'admin') throw new ForbiddenException('Impossible de supprimer un admin');
    // Supprimer les affectations liées
    await this.affectationModel.deleteMany({ operateur_id: id }).exec();
    await this.utilisateurModel.findByIdAndDelete(id).exec();
    return { message: 'Utilisateur supprime' };
  }
}