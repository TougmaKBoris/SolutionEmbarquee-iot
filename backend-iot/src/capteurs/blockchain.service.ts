import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { CapteurData, CapteurDataDocument } from './entities/capteur-data.entity';

export interface ResultatVerification {
  valide: boolean;
  blocs: number;
  erreurs: { index: number; id: string; raison: string }[];
}

export interface StatsCapteurBlockchain {
  type: string;
  blocs: number;
  dernierHash: string;
  valide: boolean;
}

@Injectable()
export class BlockchainService {
  private readonly GENESIS_HASH = '0'.repeat(64);

  constructor(
    @InjectModel(CapteurData.name) private capteurDataModel: Model<CapteurDataDocument>,
  ) {}

  calculerHash(
    machineId: string,
    type: string,
    valeur: number,
    unite: string,
    timestamp: Date,
    hashPrecedent: string,
  ): string {
    const contenu = JSON.stringify({
      machineId,
      type,
      valeur,
      unite,
      timestamp: timestamp.toISOString(),
      hashPrecedent,
    });
    return crypto.createHash('sha256').update(contenu).digest('hex');
  }

  async obtenirDernierHash(machineId: string, type: string): Promise<string> {
    if (!Types.ObjectId.isValid(machineId)) return this.GENESIS_HASH;
    const dernier = await this.capteurDataModel
      .findOne({ machine_id: new Types.ObjectId(machineId), type, hash_propre: { $exists: true, $ne: '' } })
      .sort({ timestamp: -1 })
      .select('hash_propre')
      .exec();
    return dernier?.hash_propre || this.GENESIS_HASH;
  }

  async enregistrerAvecHash(
    machineId: Types.ObjectId | string,
    type: string,
    valeur: number,
    unite: string,
    timestamp: Date,
  ): Promise<CapteurDataDocument> {
    const mid = machineId.toString();
    const hashPrecedent = await this.obtenirDernierHash(mid, type);
    const hashPropre = this.calculerHash(mid, type, valeur, unite, timestamp, hashPrecedent);
    return this.capteurDataModel.create({
      machine_id: machineId instanceof Types.ObjectId ? machineId : new Types.ObjectId(mid),
      type,
      valeur,
      unite,
      timestamp,
      hash_precedent: hashPrecedent,
      hash_propre: hashPropre,
    });
  }

  async verifierChaine(machineId: string, type: string): Promise<ResultatVerification> {
    if (!Types.ObjectId.isValid(machineId)) {
      return { valide: false, blocs: 0, erreurs: [{ index: -1, id: '', raison: 'machineId invalide' }] };
    }

    const blocs = await this.capteurDataModel
      .find({ machine_id: new Types.ObjectId(machineId), type, hash_propre: { $exists: true, $ne: '' } })
      .sort({ timestamp: 1 })
      .exec();

    const erreurs: { index: number; id: string; raison: string }[] = [];

    for (let i = 0; i < blocs.length; i++) {
      const bloc = blocs[i];
      const id = (bloc as any)._id?.toString() || '';

      // Vérifier le hash_propre du bloc
      const hashAttendu = this.calculerHash(
        machineId,
        bloc.type,
        bloc.valeur,
        bloc.unite,
        bloc.timestamp,
        bloc.hash_precedent || this.GENESIS_HASH,
      );

      if (bloc.hash_propre !== hashAttendu) {
        erreurs.push({ index: i, id, raison: 'hash_propre invalide — données potentiellement modifiées' });
        continue;
      }

      // Vérifier le chaînage avec le bloc précédent
      if (i === 0) {
        if (bloc.hash_precedent !== this.GENESIS_HASH) {
          erreurs.push({ index: i, id, raison: 'bloc genesis invalide (hash_precedent attendu : 0*64)' });
        }
      } else {
        if (bloc.hash_precedent !== blocs[i - 1].hash_propre) {
          erreurs.push({ index: i, id, raison: `chaîne rompue — hash_precedent ne correspond pas au bloc ${i - 1}` });
        }
      }
    }

    return { valide: erreurs.length === 0, blocs: blocs.length, erreurs };
  }

  async statsBlockchain(machineId: string): Promise<{ capteurs: StatsCapteurBlockchain[] }> {
    if (!Types.ObjectId.isValid(machineId)) return { capteurs: [] };

    const types: string[] = await this.capteurDataModel
      .distinct('type', { machine_id: new Types.ObjectId(machineId), hash_propre: { $exists: true, $ne: '' } })
      .exec();

    const capteurs = await Promise.all(
      types.map(async (type) => {
        const verification = await this.verifierChaine(machineId, type);
        const dernierHash = await this.obtenirDernierHash(machineId, type);
        return {
          type,
          blocs: verification.blocs,
          dernierHash: dernierHash.substring(0, 16) + '...',
          valide: verification.valide,
        };
      }),
    );

    return { capteurs };
  }
}
