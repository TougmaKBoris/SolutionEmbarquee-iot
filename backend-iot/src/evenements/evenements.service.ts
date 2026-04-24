import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Evenement, EvenementDocument } from './entities/evenement.entity';

@Injectable()
export class EvenementsService {
  constructor(
    @InjectModel(Evenement.name) private evenementModel: Model<EvenementDocument>,
  ) {}

  async creer(data: {
    type: string;
    machine_id: string;
    machine_nom: string;
    utilisateur_id?: string;
    utilisateur_nom?: string;
    utilisateur_role?: string;
    description: string;
    metadata?: Record<string, any>;
  }) {
    if (!data.machine_id || !Types.ObjectId.isValid(data.machine_id)) return null;

    return this.evenementModel.create({
      type: data.type,
      machine_id: new Types.ObjectId(data.machine_id),
      machine_nom: data.machine_nom,
      utilisateur_id: data.utilisateur_id || null,
      utilisateur_nom: data.utilisateur_nom || 'Systeme',
      utilisateur_role: data.utilisateur_role || 'systeme',
      description: data.description,
      metadata: data.metadata || {},
    });
  }

  async findAll(filtres?: { machine_id?: string; periode?: string; type?: string }) {
    const query: any = {};

    if (filtres?.machine_id && Types.ObjectId.isValid(filtres.machine_id)) {
      query.machine_id = new Types.ObjectId(filtres.machine_id);
    }

    if (filtres?.type) {
      query.type = filtres.type;
    }

    if (filtres?.periode) {
      const now = new Date();
      const periodes: Record<string, number> = {
        '1h': 1 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7j': 7 * 24 * 60 * 60 * 1000,
        '30j': 30 * 24 * 60 * 60 * 1000,
      };
      const ms = periodes[filtres.periode];
      if (ms) {
        query.createdAt = { $gte: new Date(now.getTime() - ms) };
      }
    }

    return this.evenementModel.find(query).sort({ createdAt: -1 }).limit(200).exec();
  }
}