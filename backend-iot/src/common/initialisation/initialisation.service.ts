import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Utilisateur, UtilisateurDocument } from '../../utilisateurs/entities/utilisateur.entity';
import { Machine, MachineDocument } from '../../machines/entities/machine.entity';
import { Seuil, SeuilDocument } from '../../seuils/entities/seuil.entity';
import { Actionneur, ActionneurDocument } from '../../actionneurs/entities/actionneur.entity';
import { Affectation, AffectationDocument } from '../../affectations/entities/affectation.entity';
import { MachineSupprimee, MachineSupprimeeDocument } from './machine-supprimee.schema';

@Injectable()
export class InitialisationService implements OnModuleInit {
  private readonly logger = new Logger(InitialisationService.name);

  constructor(
    @InjectModel(Utilisateur.name) private utilisateurModel: Model<UtilisateurDocument>,
    @InjectModel(Machine.name) private machineModel: Model<MachineDocument>,
    @InjectModel(Seuil.name) private seuilModel: Model<SeuilDocument>,
    @InjectModel(Actionneur.name) private actionneurModel: Model<ActionneurDocument>,
    @InjectModel(Affectation.name) private affectationModel: Model<AffectationDocument>,
    @InjectModel(MachineSupprimee.name) private machineSupprimeeModel: Model<MachineSupprimeeDocument>,
  ) {}

  async onModuleInit() {
    await this.seedUtilisateurs();
    await this.seedMachines();
    this.logger.log('Seed termine - Base de donnees initialisee');
  }

  private async seedUtilisateurs() {
    const comptes = [
      { email: 'admin@SE-iot.com', mot_de_passe: 'admin123', nom: 'Admin', role: 'admin' },
      { email: 'resp@SE-iot.com', mot_de_passe: 'resp123', nom: 'Karim', role: 'responsable_maintenance' },
      { email: 'oper1@SE-iot.com', mot_de_passe: 'oper123', nom: 'Sana', role: 'operateur' },
      { email: 'oper2@SE-iot.com', mot_de_passe: 'oper123', nom: 'Mohamed', role: 'operateur' },
    ];

    for (const compte of comptes) {
      const existe = await this.utilisateurModel.findOne({ email: compte.email }).exec();
      if (!existe) {
        const hash = await bcrypt.hash(compte.mot_de_passe, 10);
        await this.utilisateurModel.create({ ...compte, mot_de_passe: hash });
        this.logger.log(`Utilisateur cree : ${compte.email} (${compte.role})`);
      }
    }
  }

  private async seedMachines() {
    const machines = [
      { nom: 'Machine A', code: 'MA', capteurs: ['temperature', 'courant', 'vibration', 'pression'], actionneurs: ['led_rouge', 'led_verte', 'buzzer', 'servomoteur'], statut: 'en_ligne' },
      { nom: 'Machine B', code: 'MB', capteurs: ['temperature', 'courant', 'vibration'], actionneurs: ['led_rouge', 'led_verte'], statut: 'en_ligne' },
      { nom: 'Machine C', code: 'MC', capteurs: ['temperature', 'courant', 'vibration', 'pression'], actionneurs: ['led_rouge', 'buzzer', 'servomoteur'], statut: 'hors_ligne' },
    ];

    const seuilsDefaut = {
      temperature: { valeur_min: 70, valeur_max: 88, unite: '°C' },
      courant: { valeur_min: 4.5, valeur_max: 5.5, unite: 'A' },
      vibration: { valeur_min: 0.8, valeur_max: 1.1, unite: 'g' },
      pression: { valeur_min: 4.0, valeur_max: 5.0, unite: 'bar' },
    };

    for (const machineData of machines) {
      const supprimee = await this.machineSupprimeeModel.findOne({ nom: machineData.nom }).exec();
      if (supprimee) continue;

      let machine = await this.machineModel.findOne({ nom: machineData.nom }).exec();
      if (!machine) {
        machine = await this.machineModel.create(machineData);
        this.logger.log(`Machine creee : ${machineData.nom}`);

        for (const type of machineData.capteurs) {
          const seuil = seuilsDefaut[type];
          if (seuil) {
            await this.seuilModel.create({ machine_id: machine._id, type_capteur: type, ...seuil });
          }
        }

        for (const type of machineData.actionneurs) {
          await this.actionneurModel.create({ machine_id: machine._id, type, etat: false });
        }
      }
    }

    const sana = await this.utilisateurModel.findOne({ email: 'oper1@SE-iot.com' }).exec();
    const machineA = await this.machineModel.findOne({ nom: 'Machine A' }).exec();
    if (sana && machineA) {
      const existe = await this.affectationModel.findOne({ operateur_id: sana._id }).exec();
      if (!existe) {
        await this.affectationModel.create({ operateur_id: sana._id, machine_id: machineA._id });
        this.logger.log('Affectation creee : Sana -> Machine A');
      }
    }
  }
}