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

  /**
   * Logique bidirectionnelle de detection d'alertes :
   * - Valeur < valeur_min → Alerte (sous le seuil minimum)
   * - Valeur > valeur_max → Alerte (au-dessus du seuil maximum)
   * - Valeur dans [min, max] → Pas d'alerte (zone normale)
   *
   * Le niveau (attention/critique) depend de l'ampleur de l'ecart :
   * - Ecart leger (≤ 15%) → attention
   * - Ecart important (> 15%) → critique
   */
  private async verifierSeuils(machineId: string, type: string, valeur: number) {
    const seuil = await this.seuilModel.findOne({ machine_id: new Types.ObjectId(machineId), type_capteur: type }).exec();
    if (!seuil) return;

    const unites: Record<string, string> = { temperature: '°C', courant: 'A', vibration: 'g', pression: 'bar' };
    const unite = unites[type] || '';

    let niveau: string | null = null;
    let message: string = '';
    let seuilDepasse: number = 0;

    // Cas 1 : Valeur sous le seuil minimum
    if (valeur < seuil.valeur_min) {
      const ecart = ((seuil.valeur_min - valeur) / seuil.valeur_min) * 100;
      seuilDepasse = seuil.valeur_min;
      if (ecart > 15) {
        niveau = 'critique';
        message = `${type} critique : ${valeur} ${unite} (sous le seuil minimum ${seuil.valeur_min} ${unite})`;
      } else {
        niveau = 'attention';
        message = `${type} anormale : ${valeur} ${unite} (sous le seuil minimum ${seuil.valeur_min} ${unite})`;
      }
    }
    // Cas 2 : Valeur au-dessus du seuil maximum
    else if (valeur > seuil.valeur_max) {
      const ecart = ((valeur - seuil.valeur_max) / seuil.valeur_max) * 100;
      seuilDepasse = seuil.valeur_max;
      if (ecart > 15) {
        niveau = 'critique';
        message = `${type} critique : ${valeur} ${unite} (au-dessus du seuil maximum ${seuil.valeur_max} ${unite})`;
      } else {
        niveau = 'attention';
        message = `${type} anormale : ${valeur} ${unite} (au-dessus du seuil maximum ${seuil.valeur_max} ${unite})`;
      }
    }
    // Cas 3 : Valeur dans la plage normale → pas d'alerte

    if (niveau) {
      // Verifier s'il existe deja une alerte non resolue pour ce capteur sur cette machine
      const alerteExistante = await this.alerteModel.findOne({
        machine_id: new Types.ObjectId(machineId),
        type_capteur: type,
        resolue: false,
      }).exec();

      if (alerteExistante) {
        // Mettre a jour l'alerte existante
        alerteExistante.valeur = valeur;
        alerteExistante.seuil_depasse = seuilDepasse;
        alerteExistante.niveau = niveau;
        alerteExistante.message = message;
        await alerteExistante.save();
      } else {
        // Creer une nouvelle alerte
        await this.alerteModel.create({
          machine_id: new Types.ObjectId(machineId),
          type_capteur: type,
          valeur,
          seuil_depasse: seuilDepasse,
          niveau,
          message,
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