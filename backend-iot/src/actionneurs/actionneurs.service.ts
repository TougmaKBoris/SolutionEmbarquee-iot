import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Actionneur, ActionneurDocument } from './entities/actionneur.entity';
import { CommandeActionneurDto } from './dto/commande-actionneur.dto';
import { Machine, MachineDocument } from '../machines/entities/machine.entity';
import { EvenementsService } from '../evenements/evenements.service';
import { TempsReelGateway } from '../temps-reel/temps-reel.gateway';
import { MqttService } from '../mqtt/mqtt.service';

@Injectable()
export class ActionneursService {
  constructor(
    @InjectModel(Actionneur.name) private actionneurModel: Model<ActionneurDocument>,
    @InjectModel(Machine.name) private machineModel: Model<MachineDocument>,
    private readonly evenementsService: EvenementsService,
    private readonly tempsReelGateway: TempsReelGateway,
    private readonly mqttService: MqttService,
  ) {}

  async getByMachine(machineId: string) {
    return this.actionneurModel.find({ machine_id: new Types.ObjectId(machineId) }).exec();
  }

  async commande(machineId: string, dto: CommandeActionneurDto, utilisateur?: { userId: string; nom: string; role: string }) {
    const machine = await this.machineModel.findById(machineId).exec();
    if (!machine) throw new NotFoundException('Machine non trouvee');

    if (machine.etat === 'arretee') {
      throw new ForbiddenException("Commande impossible : la machine est arretee. Redemarrez-la d'abord.");
    }

    if (machine.mode === 'auto') {
      throw new ForbiddenException('Commande impossible : la machine est en mode automatique. Passez en mode manuel pour la controler.');
    }

    const actionneur = await this.actionneurModel.findOneAndUpdate(
      { machine_id: new Types.ObjectId(machineId), type: dto.type },
      { etat: dto.etat, derniere_commande: new Date() },
      { new: true, upsert: true },
    ).exec();

    await this.evenementsService.creer({
      type: 'commande_actionneur',
      machine_id: machineId,
      machine_nom: machine.nom,
      utilisateur_id: utilisateur?.userId,
      utilisateur_nom: utilisateur?.nom || 'Utilisateur',
      utilisateur_role: utilisateur?.role || 'inconnu',
      description: `Actionneur ${dto.type} mis a ${dto.etat ? 'ON' : 'OFF'} sur ${machine.nom}`,
      metadata: { type_actionneur: dto.type, nouvel_etat: dto.etat },
    });

    // Emettre via Socket.IO
    this.tempsReelGateway.emitToMachine(machineId, 'actionneur:update', {
      machine_id: machineId,
      type: dto.type,
      etat: dto.etat,
    });

    // Si machine MQTT, publier la commande vers le vrai actionneur
    if (machine.source === 'mqtt') {
      await this.mqttService.publishCommande(machineId, dto.type, dto.etat);
    }

    return actionneur;
  }
}