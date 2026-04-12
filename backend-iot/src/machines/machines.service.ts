import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Machine, MachineDocument } from './entities/machine.entity';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { Actionneur, ActionneurDocument } from '../actionneurs/entities/actionneur.entity';
import { Seuil, SeuilDocument } from '../seuils/entities/seuil.entity';
import { Alerte, AlerteDocument } from '../alertes/entities/alerte.entity';
import { EvenementsService } from '../evenements/evenements.service';

@Injectable()
export class MachinesService {
  private readonly seuilsDefaut = {
    temperature: { valeur_min: 70, valeur_max: 88 },
    courant: { valeur_min: 4.5, valeur_max: 5.5 },
    vibration: { valeur_min: 0.8, valeur_max: 1.1 },
    pression: { valeur_min: 4.0, valeur_max: 5.0 },
  };

  constructor(
    @InjectModel(Machine.name) private machineModel: Model<MachineDocument>,
    @InjectModel(Actionneur.name) private actionneurModel: Model<ActionneurDocument>,
    @InjectModel(Seuil.name) private seuilModel: Model<SeuilDocument>,
    @InjectModel(Alerte.name) private alerteModel: Model<AlerteDocument>,
    private readonly evenementsService: EvenementsService,
  ) {}

  async findAll() { return this.machineModel.find().exec(); }

  async findOne(id: string) {
    const machine = await this.machineModel.findById(id).exec();
    if (!machine) throw new NotFoundException('Machine non trouvee');
    return machine;
  }

  async create(dto: CreateMachineDto) {
    const machine = await this.machineModel.create(dto);

    for (const type of machine.actionneurs) {
      await this.actionneurModel.create({ machine_id: machine._id, type, etat: false });
    }

    for (const type of machine.capteurs) {
      const seuil = this.seuilsDefaut[type];
      if (seuil) {
        await this.seuilModel.create({ machine_id: machine._id, type_capteur: type, ...seuil });
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
    await this.actionneurModel.deleteMany({ machine_id: id }).exec();
    await this.seuilModel.deleteMany({ machine_id: id }).exec();
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

    return machine;
  }

  async arretUrgence(id: string, utilisateur: { nom: string; role: string; id: string }) {
    const machine = await this.machineModel.findById(id).exec();
    if (!machine) throw new NotFoundException('Machine non trouvee');

    machine.etat = 'arretee';
    machine.statut = 'hors_ligne';
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

    return { message: `Arret d'urgence applique sur ${machine.nom}`, machine };
  }

  async redemarrer(id: string, utilisateur?: { id: string; nom: string; role: string }) {
    const machine = await this.machineModel.findById(id).exec();
    if (!machine) throw new NotFoundException('Machine non trouvee');

    if (machine.etat === 'en_marche') {
      throw new BadRequestException('La machine est deja en marche');
    }

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

    return { message: `Machine ${machine.nom} redemarree`, machine };
  }
}