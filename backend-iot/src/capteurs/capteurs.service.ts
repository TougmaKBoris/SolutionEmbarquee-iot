import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CapteurData, CapteurDataDocument } from './entities/capteur-data.entity';
import { Machine, MachineDocument } from '../machines/entities/machine.entity';
import { Alerte, AlerteDocument } from '../alertes/entities/alerte.entity';
import { Seuil, SeuilDocument } from '../seuils/entities/seuil.entity';
import { EmailsService } from '../emails/emails.service';
import { TempsReelGateway } from '../temps-reel/temps-reel.gateway';

@Injectable()
export class CapteursService {
  private readonly logger = new Logger(CapteursService.name);
  private liveData: Map<string, any[]> = new Map();
  private compteursEtat: Map<string, number> = new Map();

  constructor(
    @InjectModel(CapteurData.name) private capteurDataModel: Model<CapteurDataDocument>,
    @InjectModel(Machine.name) private machineModel: Model<MachineDocument>,
    @InjectModel(Alerte.name) private alerteModel: Model<AlerteDocument>,
    @InjectModel(Seuil.name) private seuilModel: Model<SeuilDocument>,
    private readonly emailsService: EmailsService,
    private readonly tempsReelGateway: TempsReelGateway,
  ) {}

  private genererValeur(type: string, seuil?: any, machineId?: string): { valeur: number; unite: string } {
    switch (type) {
      case 'temperature': return { valeur: +(55 + Math.random() * 35).toFixed(1), unite: '°C' };
      case 'courant': return { valeur: +(2 + Math.random() * 4).toFixed(2), unite: 'A' };
      case 'vibration': return { valeur: +(0.1 + Math.random() * 1.2).toFixed(2), unite: 'g' };
      case 'pression': return { valeur: +(1 + Math.random() * 5.5).toFixed(1), unite: 'bar' };
      default: {
        if (seuil) {
          const typeDonnee = (seuil as any).type_donnee || 'numerique';
          if (typeDonnee === 'binaire') {
            return { valeur: Math.random() > 0.2 ? 1 : 0, unite: seuil.unite || '' };
          }
          if (typeDonnee === 'compteur') {
            const cle = machineId ? `${machineId}-${type}` : type;
            const derniere = this.compteursEtat.get(cle) ?? seuil.valeur_min;
            const increment = Math.floor(Math.random() * 5);
            const nvValeur = Math.min(derniere + increment, seuil.valeur_max);
            this.compteursEtat.set(cle, nvValeur);
            return { valeur: nvValeur, unite: seuil.unite || '' };
          }
          const range = seuil.valeur_max - seuil.valeur_min;
          const valeur = +(seuil.valeur_min - range * 0.1 + Math.random() * (range * 1.2)).toFixed(2);
          return { valeur, unite: seuil.unite || '' };
        }
        return { valeur: 0, unite: '' };
      }
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async simulerDonnees() {
    const machines = await this.machineModel.find({ statut: 'en_ligne', etat: 'en_marche', source: { $ne: 'mqtt' } }).exec();
    for (const machine of machines) {
      const seuils = await this.seuilModel.find({ machine_id: machine._id }).exec();
      const seuilsMap = new Map(seuils.map(s => [s.type_capteur, s]));

      const readings = [];
      for (const type of machine.capteurs) {
        const { valeur, unite } = this.genererValeur(type, seuilsMap.get(type), machine._id.toString());
        const data = await this.capteurDataModel.create({ machine_id: machine._id, type, valeur, unite, timestamp: new Date() });
        const type_donnee = (seuilsMap.get(type) as any)?.type_donnee || 'numerique';
        readings.push({ type, valeur, unite, timestamp: data.timestamp, type_donnee });
        await this.verifierSeuils(machine._id.toString(), machine.nom, type, valeur, unite);
      }
      this.liveData.set(machine._id.toString(), readings);

      // Emettre les donnees en temps reel via Socket.IO
      this.tempsReelGateway.emitToMachine(machine._id.toString(), 'capteurs:update', {
        machine_id: machine._id.toString(),
        capteurs: readings,
      });
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
   *
   * Email envoye UNIQUEMENT quand une NOUVELLE alerte critique est creee
   * (pas lors de la mise a jour d'une alerte existante).
   */
  private async verifierSeuils(machineId: string, machineNom: string, type: string, valeur: number, unite: string) {
    if (!Types.ObjectId.isValid(machineId)) return;
    const seuil = await this.seuilModel.findOne({ machine_id: new Types.ObjectId(machineId), type_capteur: type }).exec();
    if (!seuil) return;

    let niveau: string | null = null;
    let message: string = '';
    let seuilDepasse: number = 0;
    let typeDepassement: 'sous_seuil' | 'au_dessus_max' = 'sous_seuil';

    // Cas 1 : Valeur sous le seuil minimum
    if (valeur < seuil.valeur_min) {
      const ecart = ((seuil.valeur_min - valeur) / seuil.valeur_min) * 100;
      seuilDepasse = seuil.valeur_min;
      typeDepassement = 'sous_seuil';
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
      typeDepassement = 'au_dessus_max';
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
      const alerteExistante = await this.alerteModel.findOne({
        machine_id: new Types.ObjectId(machineId),
        type_capteur: type,
        resolue: false,
      }).exec();

      if (alerteExistante) {
        const ancienNiveau = alerteExistante.niveau;
        alerteExistante.valeur = valeur;
        alerteExistante.seuil_depasse = seuilDepasse;
        alerteExistante.niveau = niveau;
        alerteExistante.message = message;

        // Email uniquement si escalade vers critique ET aucun email déjà envoyé sur cette alerte
        if (niveau === 'critique' && ancienNiveau !== 'critique' && !alerteExistante.email_envoye) {
          alerteExistante.email_envoye = true;
          await alerteExistante.save();
          this.emailsService.envoyerAlerteCritique({
            machineNom, typeCapteur: type, valeur, unite,
            seuilFranchi: seuilDepasse, typeDepassement, message, timestamp: new Date(),
          }).catch(err => this.logger.error(`Erreur email escalade : ${err.message}`));
        } else {
          await alerteExistante.save();
        }
      } else {
        // Nouvelle alerte
        const doitEnvoyerEmail = niveau === 'critique';
        const alerte = await this.alerteModel.create({
          machine_id: new Types.ObjectId(machineId),
          type_capteur: type,
          valeur,
          seuil_depasse: seuilDepasse,
          niveau,
          message,
          resolue: false,
          email_envoye: doitEnvoyerEmail,
        });

        this.tempsReelGateway.emitToMachine(machineId, 'alerte:nouvelle', alerte);
        this.tempsReelGateway.emitToAll('alerte:nouvelle', alerte);

        if (doitEnvoyerEmail) {
          this.emailsService.envoyerAlerteCritique({
            machineNom, typeCapteur: type, valeur, unite,
            seuilFranchi: seuilDepasse, typeDepassement, message, timestamp: new Date(),
          }).catch(err => this.logger.error(`Erreur email nouvelle alerte : ${err.message}`));
        }
      }
    }
  }

  getLive() {
    const result = [];
    this.liveData.forEach((readings, machineId) => { result.push({ machine_id: machineId, capteurs: readings }); });
    return result;
  }

  async getLiveByMachine(machineId: string) {
    const live = this.liveData.get(machineId);
    if (live && live.length > 0) return { machine_id: machineId, capteurs: live };

    const machine = await this.machineModel.findById(machineId).exec();
    if (!machine) return { machine_id: machineId, capteurs: [] };

    const capteurs = [];
    for (const type of machine.capteurs) {
      const derniere = await this.capteurDataModel
        .findOne({ machine_id: new Types.ObjectId(machineId), type })
        .sort({ timestamp: -1 })
        .exec();
      if (derniere) {
        const seuil = await this.seuilModel.findOne({ machine_id: new Types.ObjectId(machineId), type_capteur: type }).exec();
        capteurs.push({ type: derniere.type, valeur: derniere.valeur, unite: derniere.unite, timestamp: derniere.timestamp, type_donnee: (seuil as any)?.type_donnee || 'numerique' });
      }
    }
    return { machine_id: machineId, capteurs };
  }

  async getHistorique(machineId: string, limit = 100) {
    return this.capteurDataModel.find({ machine_id: new Types.ObjectId(machineId) }).sort({ timestamp: -1 }).limit(limit).exec();
  }

  async getHistoriqueByType(machineId: string, type: string, limit = 100) {
    return this.capteurDataModel.find({ machine_id: new Types.ObjectId(machineId), type }).sort({ timestamp: -1 }).limit(limit).exec();
  }
}