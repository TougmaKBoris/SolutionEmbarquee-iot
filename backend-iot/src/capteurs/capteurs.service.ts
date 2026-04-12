import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CapteurData, CapteurDataDocument } from './entities/capteur-data.entity';
import { Machine, MachineDocument } from '../machines/entities/machine.entity';
import { Alerte, AlerteDocument } from '../alertes/entities/alerte.entity';
import { Seuil, SeuilDocument } from '../seuils/entities/seuil.entity';

@Injectable()
export class CapteursService {
  private readonly logger = new Logger(CapteursService.name);
  private liveData: Map<string, any[]> = new Map();

  constructor(
    @InjectModel(CapteurData.name) private capteurDataModel: Model<CapteurDataDocument>,
    @InjectModel(Machine.name) private machineModel: Model<MachineDocument>,
    @InjectModel(Alerte.name) private alerteModel: Model<AlerteDocument>,
    @InjectModel(Seuil.name) private seuilModel: Model<SeuilDocument>,
  ) {}

  private genererValeur(type: string): { valeur: number; unite: string } {
    switch (type) {
      case 'temperature': return { valeur: +(55 + Math.random() * 35).toFixed(1), unite: '°C' };
      case 'courant': return { valeur: +(2 + Math.random() * 4).toFixed(2), unite: 'A' };
      case 'vibration': return { valeur: +(0.1 + Math.random() * 1.2).toFixed(2), unite: 'g' };
      case 'pression': return { valeur: +(1 + Math.random() * 5.5).toFixed(1), unite: 'bar' };
      default: return { valeur: 0, unite: '' };
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async simulerDonnees() {
    const machines = await this.machineModel.find({ statut: 'en_ligne' }).exec();
    for (const machine of machines) {
      const readings = [];
      for (const type of machine.capteurs) {
        const { valeur, unite } = this.genererValeur(type);
        const data = await this.capteurDataModel.create({ machine_id: machine._id, type, valeur, unite, timestamp: new Date() });
        readings.push({ type, valeur, unite, timestamp: data.timestamp });
        await this.verifierSeuils(machine._id.toString(), type, valeur);
      }
      this.liveData.set(machine._id.toString(), readings);
    }
    this.logger.debug(`Donnees simulees pour ${machines.length} machine(s)`);
  }

  private async verifierSeuils(machineId: string, type: string, valeur: number) {
    const seuil = await this.seuilModel.findOne({ machine_id: new Types.ObjectId(machineId), type_capteur: type }).exec();
    if (!seuil) return;

    let niveau: string | null = null;
    if (valeur >= seuil.valeur_max) niveau = 'critique';
    else if (valeur >= seuil.valeur_min && Math.random() < 0.3) niveau = 'attention';

    const unites: Record<string, string> = { temperature: '°C', courant: 'A', vibration: 'g', pression: 'bar' };

    if (niveau) {
      // Vérifier s'il existe déjà une alerte non résolue pour ce capteur sur cette machine
      const alerteExistante = await this.alerteModel.findOne({
        machine_id: new Types.ObjectId(machineId),
        type_capteur: type,
        resolue: false,
      }).exec();

      if (alerteExistante) {
        // Mettre à jour l'alerte existante avec la nouvelle valeur
        alerteExistante.valeur = valeur;
        alerteExistante.seuil_depasse = niveau === 'critique' ? seuil.valeur_max : seuil.valeur_min;
        alerteExistante.niveau = niveau;
        alerteExistante.message = `${type} ${niveau === 'critique' ? 'critique' : 'anormale'} : ${valeur} ${unites[type] || ''}`;
        await alerteExistante.save();
      } else {
        // Créer une nouvelle alerte
        await this.alerteModel.create({
          machine_id: new Types.ObjectId(machineId),
          type_capteur: type,
          valeur,
          seuil_depasse: niveau === 'critique' ? seuil.valeur_max : seuil.valeur_min,
          niveau,
          message: `${type} ${niveau === 'critique' ? 'critique' : 'anormale'} : ${valeur} ${unites[type] || ''}`,
          resolue: false,
        });
      }
    }
  }

  getLive() {
    const result = [];
    this.liveData.forEach((readings, machineId) => { result.push({ machine_id: machineId, capteurs: readings }); });
    return result;
  }

  getLiveByMachine(machineId: string) {
    return { machine_id: machineId, capteurs: this.liveData.get(machineId) || [] };
  }

  async getHistorique(machineId: string, limit = 100) {
    return this.capteurDataModel.find({ machine_id: new Types.ObjectId(machineId) }).sort({ timestamp: -1 }).limit(limit).exec();
  }

  async getHistoriqueByType(machineId: string, type: string, limit = 100) {
    return this.capteurDataModel.find({ machine_id: new Types.ObjectId(machineId), type }).sort({ timestamp: -1 }).limit(limit).exec();
  }
}