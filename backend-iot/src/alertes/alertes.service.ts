import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Alerte, AlerteDocument } from './entities/alerte.entity';
import { EvenementsService } from '../evenements/evenements.service';
import { TempsReelGateway } from '../temps-reel/temps-reel.gateway';

@Injectable()
export class AlertesService {
  private readonly logger = new Logger(AlertesService.name);

  constructor(
    @InjectModel(Alerte.name) private alerteModel: Model<AlerteDocument>,
    private readonly evenementsService: EvenementsService,
    private readonly tempsReelGateway: TempsReelGateway,
  ) {
    setTimeout(() => this.supprimerAnciennesAlertes(), 5000);
  }

  async findAll() {
    return this.alerteModel.find().populate('machine_id', 'nom').sort({ createdAt: -1 }).exec();
  }

  async findNonResolues(machineId?: string) {
    const filtre: any = { resolue: false };
    if (machineId) filtre.machine_id = new Types.ObjectId(machineId);
    return this.alerteModel.find(filtre).populate('machine_id', 'nom').sort({ createdAt: -1 }).exec();
  }

  async resoudre(id: string, utilisateur?: { id: string; nom: string; role: string }) {
    const alerte = await this.alerteModel
      .findByIdAndUpdate(id, { resolue: true, resolue_le: new Date() }, { new: true })
      .populate('machine_id', 'nom')
      .exec();
    if (!alerte) throw new NotFoundException('Alerte non trouvee');

    const machineNom = (alerte.machine_id as any)?.nom || 'Inconnue';
    const machineId = (alerte.machine_id as any)?._id?.toString() || alerte.machine_id?.toString();

    await this.evenementsService.creer({
      type: 'alerte_resolue',
      machine_id: machineId,
      machine_nom: machineNom,
      utilisateur_id: utilisateur?.id,
      utilisateur_nom: utilisateur?.nom || 'Systeme',
      utilisateur_role: utilisateur?.role || 'systeme',
      description: `Alerte ${alerte.niveau} resolue : ${alerte.type_capteur}`,
      metadata: {
        niveau: alerte.niveau,
        type_capteur: alerte.type_capteur,
        valeur: alerte.valeur,
      },
    });

    // Emettre via Socket.IO
    this.tempsReelGateway.emitToMachine(machineId, 'alerte:resolue', alerte);
    this.tempsReelGateway.emitToAll('alerte:resolue', alerte);

    return alerte;
  }

  async ignorer(id: string, utilisateur?: { id: string; nom: string; role: string }) {
    const alerte = await this.alerteModel
      .findByIdAndUpdate(id, { resolue: true, resolue_le: new Date(), niveau: 'ignoree' }, { new: true })
      .populate('machine_id', 'nom')
      .exec();
    if (!alerte) throw new NotFoundException('Alerte non trouvee');

    const machineNom = (alerte.machine_id as any)?.nom || 'Inconnue';
    const machineId = (alerte.machine_id as any)?._id?.toString() || alerte.machine_id?.toString();

    await this.evenementsService.creer({
      type: 'alerte_resolue',
      machine_id: machineId,
      machine_nom: machineNom,
      utilisateur_id: utilisateur?.id,
      utilisateur_nom: utilisateur?.nom || 'Systeme',
      utilisateur_role: utilisateur?.role || 'systeme',
      description: `Alerte ignoree : ${alerte.type_capteur}`,
      metadata: { type_capteur: alerte.type_capteur },
    });

    // Emettre via Socket.IO
    this.tempsReelGateway.emitToMachine(machineId, 'alerte:resolue', alerte);
    this.tempsReelGateway.emitToAll('alerte:resolue', alerte);

    return alerte;
  }

  async supprimer(id: string) {
    const result = await this.alerteModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Alerte non trouvee');
    return { message: 'Alerte supprimee' };
  }

  async supprimerToutesNonResolues() {
    const result = await this.alerteModel.deleteMany({ resolue: false }).exec();
    this.logger.log(`${result.deletedCount} alertes non resolues supprimees`);
    return { message: `${result.deletedCount} alertes supprimees` };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async supprimerAnciennesAlertes() {
    const limite = new Date(Date.now() - 60 * 60 * 1000);
    const result = await this.alerteModel.deleteMany({ resolue: true, resolue_le: { $lt: limite } }).exec();
    if (result.deletedCount > 0) {
      this.logger.log(`${result.deletedCount} alertes resolues de plus d'1h supprimees`);
    }
  }
}