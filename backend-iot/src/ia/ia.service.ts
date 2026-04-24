import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Alerte, AlerteDocument } from '../alertes/entities/alerte.entity';
import { CapteurData, CapteurDataDocument } from '../capteurs/entities/capteur-data.entity';
import { Machine, MachineDocument } from '../machines/entities/machine.entity';
import { Seuil, SeuilDocument } from '../seuils/entities/seuil.entity';

@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);
  private readonly IA_URL = process.env.IA_SERVICE_URL || 'http://localhost:8000';

  constructor(
    @InjectModel(Alerte.name) private alerteModel: Model<AlerteDocument>,
    @InjectModel(CapteurData.name) private capteurDataModel: Model<CapteurDataDocument>,
    @InjectModel(Machine.name) private machineModel: Model<MachineDocument>,
    @InjectModel(Seuil.name) private seuilModel: Model<SeuilDocument>,
  ) {}

  private async getSeuilsParMachine(machineId: any) {
    const seuils = await this.seuilModel.find({ machine_id: machineId }).exec();
    const seuilsMap: any = {};
    for (const s of seuils) {
      seuilsMap[s.type_capteur] = { min: s.valeur_min, max: s.valeur_max };
    }
    return seuilsMap;
  }

  async getAnalyse() {
    try {
      const machines = await this.machineModel.find().exec();
      const resultats = [];

      for (const machine of machines) {
        const derniersDonnees = await this.capteurDataModel
          .find({ machine_id: machine._id })
          .sort({ timestamp: -1 })
          .limit(4)
          .exec();

        if (derniersDonnees.length === 0) continue;

        const valeurs = { temperature: 0, vibration: 0, pression: 0, energie: 0 };
        for (const d of derniersDonnees) {
          if (d.type === 'temperature') valeurs.temperature = d.valeur;
          if (d.type === 'vibration') valeurs.vibration = d.valeur;
          if (d.type === 'pression') valeurs.pression = d.valeur;
          if (d.type === 'courant') valeurs.energie = d.valeur;
        }

        const seuilsMachine = await this.getSeuilsParMachine(machine._id);

        const alertesActives = await this.alerteModel
          .find({ machine_id: machine._id, resolue: false })
          .exec();

        const nbCritiques = alertesActives.filter(a => a.niveau === 'critique').length;
        const nbAttention = alertesActives.filter(a => a.niveau === 'attention').length;
        const downtime_risk = Math.min(1.0, (nbCritiques * 0.4 + nbAttention * 0.15));
        const maintenance_required = (nbCritiques > 0 || nbAttention >= 2) ? 1 : 0;

        try {
          const response = await fetch(`${this.IA_URL}/analyse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...valeurs,
              downtime_risk,
              maintenance_required,
              seuils: seuilsMachine,
            }),
          });

          if (!response.ok) throw new Error('Erreur service IA');

          const prediction = await response.json();
          resultats.push({
            machine_id: machine._id,
            machine_nom: machine.nom,
            ...prediction,
          });
        } catch {
          resultats.push({
            machine_id: machine._id,
            machine_nom: machine.nom,
            mode: 'degrade',
            message: 'Service IA non connecte',
          });
        }
      }

      return {
        mode: 'ia',
        timestamp: new Date(),
        analyses: resultats,
      };
    } catch (error) {
      this.logger.warn('Erreur analyse IA, mode degrade');
      return this.analyseDegradee();
    }
  }

  async getTendances(machineId: string) {
    const machine = await this.machineModel.findById(machineId).exec();
    if (!machine) return { erreur: 'Machine non trouvee' };

    const seuilsMachine = await this.getSeuilsParMachine(machineId);
    const types = ['temperature', 'courant', 'vibration', 'pression'];
    const tendances = [];

    for (const type of types) {
      const lectures = await this.capteurDataModel
        .find({ machine_id: machineId, type })
        .sort({ timestamp: 1 })
        .limit(20)
        .exec();

      if (lectures.length < 3) continue;

      const seuil = seuilsMachine[type];
      if (!seuil) continue;

      const n = lectures.length;
      const t0 = new Date(lectures[0].timestamp).getTime();
      const xs = lectures.map(l => (new Date(l.timestamp).getTime() - t0) / 60000);
      const ys = lectures.map(l => l.valeur);

      const xMean = xs.reduce((a, b) => a + b, 0) / n;
      const yMean = ys.reduce((a, b) => a + b, 0) / n;
      const num = xs.reduce((sum, x, i) => sum + (x - xMean) * (ys[i] - yMean), 0);
      const den = xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0);
      const pente = den !== 0 ? num / den : 0;

      const valeurActuelle = ys[n - 1];
      let tempsAvantSeuilMinutes: number | null = null;
      let typeDepassement: 'max' | 'min' | null = null;

      if (pente > 0.001 && seuil.max && valeurActuelle < seuil.max) {
        tempsAvantSeuilMinutes = Math.round((seuil.max - valeurActuelle) / pente);
        typeDepassement = 'max';
      } else if (pente < -0.001 && seuil.min && valeurActuelle > seuil.min) {
        tempsAvantSeuilMinutes = Math.round((valeurActuelle - seuil.min) / Math.abs(pente));
        typeDepassement = 'min';
      }

      tendances.push({
        capteur: type,
        valeurs: lectures.map(l => ({ timestamp: l.timestamp, valeur: l.valeur })),
        valeurActuelle,
        seuilMin: seuil.min,
        seuilMax: seuil.max,
        unite: lectures[0].unite,
        penteParMinute: Math.round(pente * 1000) / 1000,
        direction: pente > 0.001 ? 'hausse' : pente < -0.001 ? 'baisse' : 'stable',
        tempsAvantSeuilMinutes,
        typeDepassement,
        alertePrecoce: tempsAvantSeuilMinutes !== null && tempsAvantSeuilMinutes < 120,
      });
    }

    return {
      machine_id: machineId,
      machine_nom: machine.nom,
      timestamp: new Date(),
      tendances,
    };
  }

  async getHistoriquePannes() {
    const alertes = await this.alerteModel
      .find({ resolue: true })
      .populate('machine_id', 'nom')
      .sort({ resolue_le: -1 })
      .limit(50)
      .exec();

    return alertes.map(a => ({
      _id: a._id,
      date: a.resolue_le || (a as any).createdAt,
      machine: (a.machine_id as any)?.nom || 'Inconnue',
      capteur: a.type_capteur,
      valeur: a.valeur,
      niveau: a.niveau,
      statut: 'Résolue',
    }));
  }

  private async analyseDegradee() {
    const alertesActives = await this.alerteModel
      .find({ resolue: false })
      .populate('machine_id', 'nom')
      .exec();

    const parMachine = {};
    for (const alerte of alertesActives) {
      const machineNom = (alerte.machine_id as any)?.nom || 'Inconnue';
      if (!parMachine[machineNom]) parMachine[machineNom] = { alertes: [], risque: 'faible' };
      parMachine[machineNom].alertes.push(alerte);
      if (alerte.niveau === 'critique') parMachine[machineNom].risque = 'eleve';
      else if (parMachine[machineNom].risque !== 'eleve') parMachine[machineNom].risque = 'moyen';
    }

    return {
      mode: 'degrade',
      message: 'Service IA non connecte - analyse basique',
      machines: parMachine,
      timestamp: new Date(),
    };
  }
}