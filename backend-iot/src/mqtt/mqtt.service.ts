import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import { MqttClient } from 'mqtt';
import { CapteurData, CapteurDataDocument } from '../capteurs/entities/capteur-data.entity';
import { Machine, MachineDocument } from '../machines/entities/machine.entity';
import { Alerte, AlerteDocument } from '../alertes/entities/alerte.entity';
import { Seuil, SeuilDocument } from '../seuils/entities/seuil.entity';
import { EmailsService } from '../emails/emails.service';
import { TempsReelGateway } from '../temps-reel/temps-reel.gateway';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: MqttClient | null = null;
  private liveData: Map<string, any[]> = new Map();

  constructor(
    @InjectModel(CapteurData.name) private capteurDataModel: Model<CapteurDataDocument>,
    @InjectModel(Machine.name) private machineModel: Model<MachineDocument>,
    @InjectModel(Alerte.name) private alerteModel: Model<AlerteDocument>,
    @InjectModel(Seuil.name) private seuilModel: Model<SeuilDocument>,
    private readonly emailsService: EmailsService,
    private readonly tempsReelGateway: TempsReelGateway,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const brokerUrl = this.configService.get<string>('MQTT_BROKER_URL');
    if (!brokerUrl) {
      this.logger.warn('MQTT_BROKER_URL non defini — service MQTT desactive');
      return;
    }

    this.client = mqtt.connect(brokerUrl, {
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    });

    this.client.on('connect', () => {
      this.logger.log(`Connecte au broker MQTT : ${brokerUrl}`);
      this.client.subscribe('capteurs/+/+', (err) => {
        if (err) this.logger.error('Erreur subscribe capteurs:', err.message);
        else this.logger.log('Subscribe a capteurs/+/+');
      });
      this.client.subscribe('actionneurs/+/+/status', (err) => {
        if (err) this.logger.error('Erreur subscribe actionneurs:', err.message);
        else this.logger.log('Subscribe a actionneurs/+/+/status');
      });
      // BUG 7 FIX : Souscrire au feedback d'état machine depuis l'ESP32
      this.client.subscribe('machines/+/etat/status', (err) => {
        if (err) this.logger.error('Erreur subscribe machines etat:', err.message);
        else this.logger.log('Subscribe a machines/+/etat/status');
      });
    });

    this.client.on('error', (err) => {
      this.logger.error(`Erreur MQTT : ${err.message}`);
    });

    this.client.on('reconnect', () => {
      this.logger.warn('Reconnexion au broker MQTT...');
    });

    this.client.on('message', (topic, message) => {
      this.traiterMessage(topic, message.toString()).catch(err => {
        this.logger.error(`Erreur traitement message MQTT : ${err.message}`);
      });
    });
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.end();
      this.logger.log('Deconnecte du broker MQTT');
    }
  }

  private async traiterMessage(topic: string, payload: string) {
    const parties = topic.split('/');

    // capteurs/{machineId}/{typeCapteur}
    if (parties[0] === 'capteurs' && parties.length === 3) {
      const [, machineId, typeCapteur] = parties;
      await this.traiterDonneeCapteur(machineId, typeCapteur, payload);
    }

    // actionneurs/{machineId}/{type}/status
    if (parties[0] === 'actionneurs' && parties.length === 4 && parties[3] === 'status') {
      const [, machineId, typeActionneur] = parties;
      this.logger.debug(`Status actionneur recu : ${machineId}/${typeActionneur} — ${payload}`);
      try {
        const data = JSON.parse(payload);
        this.tempsReelGateway.emitToMachine(machineId, 'actionneur:update', {
          machine_id: machineId,
          type: typeActionneur,
          etat: data.etat,
        });
      } catch (e) {
        this.logger.error(`Payload actionneur invalide : ${payload}`);
      }
    }

    // BUG 7 FIX : machines/{machineCode}/etat/status — feedback ESP32
    if (parties[0] === 'machines' && parties.length === 4 && parties[2] === 'etat' && parties[3] === 'status') {
      const machineCode = parties[1];
      this.logger.log(`Feedback etat machine recu : ${machineCode} — ${payload}`);
      try {
        const data = JSON.parse(payload);
        const machine = await this.machineModel.findOne({ code: machineCode }).exec();
        if (machine) {
          machine.etat = data.etat;
          if (data.etat === 'en_marche') machine.statut = 'en_ligne';
          await machine.save();
          const mid = machine._id.toString();
          this.tempsReelGateway.emitToMachine(mid, 'machine:etatChange', {
            machine_id: mid,
            mode: machine.mode,
            etat: data.etat,
            statut: machine.statut,
          });
          this.tempsReelGateway.emitToAll('machine:etatChange', {
            machine_id: mid,
            mode: machine.mode,
            etat: data.etat,
            statut: machine.statut,
          });
          this.logger.log(`Etat machine ${machine.nom} mis a jour via feedback MQTT : ${data.etat}`);
        }
      } catch (e) {
        this.logger.error(`Payload feedback machine invalide : ${payload}`);
      }
    }
  }

  private async traiterDonneeCapteur(machineId: string, typeCapteur: string, payload: string) {
    let data: { valeur: number; unite: string };
    try {
      data = JSON.parse(payload);
    } catch (e) {
      this.logger.error(`Payload capteur invalide : ${payload}`);
      return;
    }

    if (data.valeur === undefined || data.unite === undefined) {
      this.logger.error(`Payload capteur incomplet : ${payload}`);
      return;
    }

    const machine = await this.machineModel.findOne({
      $or: [
        { _id: Types.ObjectId.isValid(machineId) ? new Types.ObjectId(machineId) : null },
        { code: machineId }
      ]
    }).exec();

    if (!machine || machine.source !== 'mqtt') {
      this.logger.warn(`Machine [${machineId}] non trouvee ou pas en mode MQTT`);
      return;
    }

    const mid = machine._id.toString();

    if (machine.statut !== 'en_ligne') return;

    const seuil = await this.seuilModel.findOne({
      machine_id: machine._id,
      type_capteur: typeCapteur,
    }).exec();
    const type_donnee = (seuil as any)?.type_donnee || 'numerique';

    const capteurData = await this.capteurDataModel.create({
      machine_id: machine._id,
      type: typeCapteur,
      valeur: data.valeur,
      unite: data.unite,
      timestamp: new Date(),
    });

    const readings = this.liveData.get(mid) || [];
    const idx = readings.findIndex(r => r.type === typeCapteur);
    const reading = {
      type: typeCapteur,
      valeur: data.valeur,
      unite: data.unite,
      timestamp: capteurData.timestamp,
      type_donnee,
    };
    if (idx >= 0) readings[idx] = reading;
    else readings.push(reading);
    this.liveData.set(mid, readings);

    this.tempsReelGateway.emitToMachine(mid, 'capteurs:update', {
      machine_id: mid,
      capteurs: readings,
    });

    await this.verifierSeuils(mid, machine.nom, typeCapteur, data.valeur, data.unite);
  }

  private async verifierSeuils(machineId: string, machineNom: string, type: string, valeur: number, unite: string) {
    if (!Types.ObjectId.isValid(machineId)) return;
    const seuil = await this.seuilModel.findOne({
      machine_id: new Types.ObjectId(machineId),
      type_capteur: type,
    }).exec();
    if (!seuil) return;

    let niveau: string | null = null;
    let message: string = '';
    let seuilDepasse: number = 0;
    let typeDepassement: 'sous_seuil' | 'au_dessus_max' = 'sous_seuil';

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
    } else if (valeur > seuil.valeur_max) {
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

        if (niveau === 'critique' && ancienNiveau !== 'critique' && !alerteExistante.email_envoye) {
          alerteExistante.email_envoye = true;
          await alerteExistante.save();
          this.emailsService.envoyerAlerteCritique({
            machineNom,
            typeCapteur: type,
            valeur,
            unite,
            seuilFranchi: seuilDepasse,
            typeDepassement,
            message,
            timestamp: new Date(),
          }).catch(err => {
            this.logger.error(`Erreur envoi email alerte critique (escalade) : ${err.message}`);
          });
        } else {
          await alerteExistante.save();
        }
      } else {
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
            machineNom,
            typeCapteur: type,
            valeur,
            unite,
            seuilFranchi: seuilDepasse,
            typeDepassement,
            message,
            timestamp: new Date(),
          }).catch(err => {
            this.logger.error(`Erreur envoi email alerte critique : ${err.message}`);
          });
        }
      }
    }
  }

  async publishCommande(machineId: string, typeActionneur: string, etat: boolean): Promise<boolean> {
    if (!this.client || !this.client.connected) {
      this.logger.warn('MQTT non connecte — commande non envoyee');
      return false;
    }

    const machine = await this.machineModel.findById(machineId).exec();
    const identifier = machine?.code || machineId;

    const topic = `actionneurs/${identifier}/${typeActionneur}`;
    const payload = JSON.stringify({ etat });
    return new Promise<boolean>((resolve) => {
      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          this.logger.error(`Erreur publish MQTT : ${err.message}`);
          resolve(false);
        } else {
          this.logger.debug(`Commande publiee : ${topic} — ${payload}`);
          resolve(true);
        }
      });
    });
  }

  async publishEtatMachine(machineCode: string, etat: string): Promise<boolean> {
    if (!this.client || !this.client.connected) {
      this.logger.warn('MQTT non connecte — etat machine non envoye');
      return false;
    }

    const topic = `machines/${machineCode}/etat`;
    const payload = JSON.stringify({ etat });
    return new Promise<boolean>((resolve) => {
      this.client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          this.logger.error(`Erreur publish etat machine : ${err.message}`);
          resolve(false);
        } else {
          this.logger.debug(`Etat machine publie : ${topic} — ${payload}`);
          resolve(true);
        }
      });
    });
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }
}