import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Machine, MachineDocument } from './entities/machine.entity';
import { CreateMachineDto } from './dto/create-machine.dto';

import { UpdateMachineDto } from './dto/update-machine.dto';
import { Actionneur, ActionneurDocument } from '../actionneurs/entities/actionneur.entity';
import { Seuil, SeuilDocument } from '../seuils/entities/seuil.entity';
import { Alerte, AlerteDocument } from '../alertes/entities/alerte.entity';
import { Affectation, AffectationDocument } from '../affectations/entities/affectation.entity';
import { CapteurData, CapteurDataDocument } from '../capteurs/entities/capteur-data.entity';
import { Evenement, EvenementDocument } from '../evenements/entities/evenement.entity';
import { EvenementsService } from '../evenements/evenements.service';
import { MachineSupprimee, MachineSupprimeeDocument } from '../common/initialisation/machine-supprimee.schema';
import { TempsReelGateway } from '../temps-reel/temps-reel.gateway';
// AJOUT : Import du MqttService
import { MqttService } from '../mqtt/mqtt.service';

@Injectable()
export class MachinesService {
  private readonly SEED_MACHINES = ['Machine A', 'Machine B', 'Machine C'];

  private readonly seuilsDefaut: Record<string, { valeur_min: number; valeur_max: number; unite: string }> = {
    temperature: { valeur_min: 70, valeur_max: 88, unite: '°C' },
    courant: { valeur_min: 4.5, valeur_max: 5.5, unite: 'A' },
    vibration: { valeur_min: 0.8, valeur_max: 1.1, unite: 'g' },
    pression: { valeur_min: 4.0, valeur_max: 5.0, unite: 'bar' },
  };

  constructor(
    @InjectModel(Machine.name) private machineModel: Model<MachineDocument>,
    @InjectModel(Actionneur.name) private actionneurModel: Model<ActionneurDocument>,
    @InjectModel(Seuil.name) private seuilModel: Model<SeuilDocument>,
    @InjectModel(Alerte.name) private alerteModel: Model<AlerteDocument>,
    @InjectModel(Affectation.name) private affectationModel: Model<AffectationDocument>,
    @InjectModel(CapteurData.name) private capteurDataModel: Model<CapteurDataDocument>,
    @InjectModel(Evenement.name) private evenementModel: Model<EvenementDocument>,
    @InjectModel(MachineSupprimee.name) private machineSupprimeeModel: Model<MachineSupprimeeDocument>,
    private readonly evenementsService: EvenementsService,
    private readonly tempsReelGateway: TempsReelGateway,
    // AJOUT : Injection du MqttService
    private readonly mqttService: MqttService,
  ) {}

  async findAll() { return this.machineModel.find().exec(); }

  async findOne(id: string) {
    const machine = await this.machineModel.findById(id).exec();
    if (!machine) throw new NotFoundException('Machine non trouvee');
    return machine;
  }

  async create(dto: CreateMachineDto) {
    const { capteursConfig, ...machineData } = dto;

    if (!machineData.code) {
      machineData.code = await this.genererCodeUnique();
    } else {
      const existe = await this.machineModel.findOne({ code: machineData.code }).exec();
      if (existe) throw new BadRequestException(`Le code machine ${machineData.code} est deja utilise`);
    }

    const machine = await this.machineModel.create(machineData);

    for (const type of machine.actionneurs) {
      await this.actionneurModel.create({ machine_id: machine._id, type, etat: false });
    }

    const configCustomMap = new Map((capteursConfig || []).map(c => [c.type, c]));

    for (const type of machine.capteurs) {
      if (this.seuilsDefaut[type]) {
        await this.seuilModel.create({ machine_id: machine._id, type_capteur: type, ...this.seuilsDefaut[type] });
      } else if (configCustomMap.has(type)) {
        const c = configCustomMap.get(type);
        await this.seuilModel.create({
          machine_id: machine._id,
          type_capteur: type,
          valeur_min: c.valeur_min,
          valeur_max: c.valeur_max,
          unite: c.unite,
          type_donnee: c.type_donnee || 'numerique',
        });
      }
    }

    return machine;
  }

  async update(id: string, dto: UpdateMachineDto) {
    const machine = await this.machineModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!machine) throw new NotFoundException('Machine non trouvee');
    return machine;
  }

  async remove(id: string) {
    const result = await this.machineModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Machine non trouvee');

    if (this.SEED_MACHINES.includes(result.nom)) {
      await this.machineSupprimeeModel.updateOne(
        { nom: result.nom },
        { nom: result.nom },
        { upsert: true },
      ).exec();
    }

    const mid = new Types.ObjectId(id);
    await Promise.all([
      this.actionneurModel.deleteMany({ machine_id: mid }).exec(),
      this.seuilModel.deleteMany({ machine_id: mid }).exec(),
      this.affectationModel.deleteMany({ machine_id: mid }).exec(),
      this.alerteModel.deleteMany({ machine_id: mid }).exec(),
      this.capteurDataModel.deleteMany({ machine_id: mid }).exec(),
      this.evenementModel.deleteMany({ machine_id: mid }).exec(),
    ]);
    return { message: 'Machine supprimee' };
  }

  async changerMode(id: string, nouveauMode: string, utilisateur?: { id: string; nom: string; role: string }) {
    if (!['auto', 'manuel'].includes(nouveauMode)) {
      throw new BadRequestException('Mode invalide. Valeurs autorisees : auto, manuel');
    }
    const ancienne = await this.machineModel.findById(id).exec();
    if (!ancienne) throw new NotFoundException('Machine non trouvee');
    const ancienMode = ancienne.mode;

    const machine = await this.machineModel.findByIdAndUpdate(
      id, { mode: nouveauMode }, { new: true },
    ).exec();

    await this.evenementsService.creer({
      type: 'changement_mode',
      machine_id: id,
      machine_nom: machine.nom,
      utilisateur_id: utilisateur?.id,
      utilisateur_nom: utilisateur?.nom || 'Systeme',
      utilisateur_role: utilisateur?.role || 'systeme',
      description: `Mode change : ${ancienMode} vers ${nouveauMode}`,
      metadata: { ancien_mode: ancienMode, nouveau_mode: nouveauMode },
    });

    this.tempsReelGateway.emitToMachine(id, 'machine:etatChange', {
      machine_id: id,
      mode: nouveauMode,
      etat: machine.etat,
    });
    this.tempsReelGateway.emitToAll('machine:etatChange', {
      machine_id: id,
      mode: nouveauMode,
      etat: machine.etat,
    });

    return machine;
  }

  async arretUrgence(id: string, utilisateur: { nom: string; role: string; id: string }) {
    const machine = await this.machineModel.findById(id).exec();
    if (!machine) throw new NotFoundException('Machine non trouvee');

    machine.etat = 'arretee';
    await machine.save();

    await this.actionneurModel.updateMany(
      { machine_id: machine._id },
      { etat: false, derniere_commande: new Date() },
    ).exec();

    await this.alerteModel.create({
      machine_id: machine._id,
      type_capteur: 'systeme',
      valeur: 0,
      seuil_depasse: 0,
      niveau: 'critique',
      message: `Arret d'urgence declenche par ${utilisateur.nom} (${utilisateur.role}) sur la machine ${machine.nom}`,
      resolue: false,
    });

    await this.evenementsService.creer({
      type: 'arret_urgence',
      machine_id: id,
      machine_nom: machine.nom,
      utilisateur_id: utilisateur.id,
      utilisateur_nom: utilisateur.nom,
      utilisateur_role: utilisateur.role,
      description: `Arret d'urgence declenche sur ${machine.nom}`,
      metadata: { actionneurs_forces_off: true },
    });

    this.tempsReelGateway.emitToMachine(id, 'machine:etatChange', {
      machine_id: id,
      mode: machine.mode,
      etat: 'arretee',
    });
    this.tempsReelGateway.emitToAll('machine:etatChange', {
      machine_id: id,
      mode: machine.mode,
      etat: 'arretee',
    });

    // BUG 2+5 FIX : Publier via MQTT avec await + actionneurs individuels
    let mqtt_envoye = false;
    if (machine.source === 'mqtt') {
      mqtt_envoye = await this.mqttService.publishEtatMachine(machine.code, 'arretee');

      // Publier l'arret de chaque actionneur individuellement
      for (const typeActionneur of machine.actionneurs) {
        await this.mqttService.publishCommande(id, typeActionneur, false);
      }
    }

    return { message: `Arret d'urgence applique sur ${machine.nom}`, machine, mqtt_envoye };
  }

  async redemarrer(id: string, utilisateur?: { id: string; nom: string; role: string }) {
    const machine = await this.machineModel.findById(id).exec();
    if (!machine) throw new NotFoundException('Machine non trouvee');

    if (machine.etat === 'en_marche' && machine.statut === 'en_ligne') {
      throw new BadRequestException('La machine est deja en marche');
    }

    await this.alerteModel.updateMany(
      { machine_id: new Types.ObjectId(id), resolue: false },
      { resolue: true, resolue_le: new Date() },
    ).exec();

    machine.etat = 'en_marche';
    machine.statut = 'en_ligne';
    await machine.save();

    await this.evenementsService.creer({
      type: 'redemarrage',
      machine_id: id,
      machine_nom: machine.nom,
      utilisateur_id: utilisateur?.id,
      utilisateur_nom: utilisateur?.nom || 'Systeme',
      utilisateur_role: utilisateur?.role || 'systeme',
      description: `Machine ${machine.nom} redemarree`,
    });

    this.tempsReelGateway.emitToMachine(id, 'machine:etatChange', {
      machine_id: id,
      mode: machine.mode,
      etat: 'en_marche',
      statut: 'en_ligne',
    });
    this.tempsReelGateway.emitToAll('machine:etatChange', {
      machine_id: id,
      mode: machine.mode,
      etat: 'en_marche',
      statut: 'en_ligne',
    });

    // BUG 2 FIX : Publier via MQTT avec await
    let mqtt_envoye = false;
    if (machine.source === 'mqtt') {
      mqtt_envoye = await this.mqttService.publishEtatMachine(machine.code, 'en_marche');
    }

    return { message: `Machine ${machine.nom} redemarree`, machine, mqtt_envoye };
  }

  private async genererCodeUnique(): Promise<string> {
    let code = '';
    let existe = true;
    while (existe) {
      const num = Math.floor(1000 + Math.random() * 9000);
      code = `M-${num}`;
      const machine = await this.machineModel.findOne({ code }).exec();
      if (!machine) existe = false;
    }
    return code;
  }
}