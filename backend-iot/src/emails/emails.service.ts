import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface AlerteCritiqueData {
  machineNom: string;
  typeCapteur: string;
  valeur: number;
  unite: string;
  seuilFranchi: number;
  typeDepassement: 'sous_seuil' | 'au_dessus_max';
  message: string;
  timestamp: Date;
}

@Injectable()
export class EmailsService implements OnModuleInit {
  private readonly logger = new Logger(EmailsService.name);
  private transporter: nodemailer.Transporter | null = null;
  private emailEnabled: boolean = false;

  async onModuleInit() {
    this.emailEnabled = process.env.EMAIL_ENABLED === 'true';

    if (!this.emailEnabled) {
      this.logger.warn('Service emails desactive (EMAIL_ENABLED != true)');
      return;
    }

    const sender = process.env.EMAIL_SENDER;
    const password = process.env.EMAIL_SENDER_PASSWORD?.replace(/\s/g, '');

    if (!sender || !password) {
      this.logger.error('Variables EMAIL_SENDER ou EMAIL_SENDER_PASSWORD manquantes');
      this.emailEnabled = false;
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: sender,
        pass: password,
      },
    });

    try {
      await this.transporter.verify();
      this.logger.log(`Service emails initialise avec succes (envoyeur: ${sender})`);
    } catch (err: any) {
  this.logger.error(`Erreur de connexion SMTP Gmail : ${err.message}`);
  this.emailEnabled = false;
}
  }

  async envoyerAlerteCritique(donnees: AlerteCritiqueData): Promise<boolean> {
    if (!this.emailEnabled || !this.transporter) {
      this.logger.debug('Email non envoye : service desactive');
      return false;
    }

    const recipients = process.env.EMAIL_RECIPIENTS?.split(',').map(e => e.trim()).filter(e => e);
    if (!recipients || recipients.length === 0) {
      this.logger.warn('Aucun destinataire configure (EMAIL_RECIPIENTS)');
      return false;
    }

    const sujet = `[ALERTE CRITIQUE] ${donnees.machineNom} - ${donnees.typeCapteur}`;
    const html = this.genererTemplateHtml(donnees);
    const texte = this.genererTemplateTexte(donnees);

    try {
      const info = await this.transporter.sendMail({
        from: `"${process.env.EMAIL_SENDER_NAME || 'Solution Embarquee'}" <${process.env.EMAIL_SENDER}>`,
        to: recipients.join(', '),
        subject: sujet,
        text: texte,
        html: html,
      });

      this.logger.log(`Email envoye avec succes a ${recipients.length} destinataire(s) - MessageId: ${info.messageId}`);
      return true;
    } catch (err: any) {
  this.logger.error(`Echec envoi email : ${err.message}`);
  return false;
}
  }

  private genererTemplateHtml(d: AlerteCritiqueData): string {
    const direction = d.typeDepassement === 'sous_seuil'
      ? `sous le seuil minimum (${d.seuilFranchi} ${d.unite})`
      : `au-dessus du seuil maximum (${d.seuilFranchi} ${d.unite})`;

    const horaire = d.timestamp.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Alerte critique</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#F1F5F9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#DC2626;padding:24px 32px;">
              <table width="100%">
                <tr>
                  <td>
                    <div style="font-size:11px;color:#FECACA;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Alerte critique</div>
                    <div style="font-size:22px;color:#fff;font-weight:700;margin-top:4px;">Intervention requise</div>
                  </td>
                  <td align="right">
                    <div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.2);text-align:center;line-height:48px;font-size:24px;">⚠️</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <div style="font-size:15px;color:#0F172A;margin-bottom:20px;">
                Une alerte critique vient d'etre detectee sur une machine du parc industriel. Une intervention est requise dans les plus brefs delais.
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF2F2;border-left:4px solid #DC2626;border-radius:6px;margin-bottom:20px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <div style="font-size:11px;color:#991B1B;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:8px;">Description</div>
                    <div style="font-size:14px;color:#7F1D1D;font-weight:500;">${d.message}</div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 14px;background:#F8FAFC;border-bottom:1px solid #E2E8F0;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;width:40%;">Machine</td>
                  <td style="padding:10px 14px;background:#F8FAFC;border-bottom:1px solid #E2E8F0;font-size:13px;color:#0F172A;font-weight:600;">${d.machineNom}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;background:#fff;border-bottom:1px solid #E2E8F0;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Capteur</td>
                  <td style="padding:10px 14px;background:#fff;border-bottom:1px solid #E2E8F0;font-size:13px;color:#0F172A;">${d.typeCapteur}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;background:#F8FAFC;border-bottom:1px solid #E2E8F0;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Valeur mesuree</td>
                  <td style="padding:10px 14px;background:#F8FAFC;border-bottom:1px solid #E2E8F0;font-size:13px;color:#DC2626;font-weight:700;">${d.valeur} ${d.unite}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;background:#fff;border-bottom:1px solid #E2E8F0;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Etat</td>
                  <td style="padding:10px 14px;background:#fff;border-bottom:1px solid #E2E8F0;font-size:13px;color:#0F172A;">${direction}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px;background:#F8FAFC;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Horodatage</td>
                  <td style="padding:10px 14px;background:#F8FAFC;font-size:13px;color:#0F172A;">${horaire}</td>
                </tr>
              </table>

              <div style="margin-top:24px;padding:14px 16px;background:#FFFBEB;border-radius:8px;font-size:12px;color:#92400E;line-height:1.6;">
                <b>Actions recommandees :</b><br>
                1. Verifier l'etat de la machine sur le tableau de bord<br>
                2. Consulter l'analyse IA pour les causes detaillees<br>
                3. Declencher un arret d'urgence si necessaire<br>
                4. Resoudre l'alerte apres intervention
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;text-align:center;">
              <div style="font-size:11px;color:#94A3B8;">
                Solution Embarquee IoT - Notification automatique<br>
                Ce message a ete genere automatiquement, merci de ne pas y repondre.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private genererTemplateTexte(d: AlerteCritiqueData): string {
    const direction = d.typeDepassement === 'sous_seuil'
      ? `sous le seuil minimum (${d.seuilFranchi} ${d.unite})`
      : `au-dessus du seuil maximum (${d.seuilFranchi} ${d.unite})`;

    return `
ALERTE CRITIQUE - Intervention requise

Une alerte critique a ete detectee :

Machine       : ${d.machineNom}
Capteur       : ${d.typeCapteur}
Valeur mesuree: ${d.valeur} ${d.unite}
Etat          : ${direction}
Message       : ${d.message}
Horodatage    : ${d.timestamp.toLocaleString('fr-FR')}

Actions recommandees :
1. Verifier l'etat de la machine sur le tableau de bord
2. Consulter l'analyse IA pour les causes detaillees
3. Declencher un arret d'urgence si necessaire
4. Resoudre l'alerte apres intervention

---
Solution Embarquee IoT - Notification automatique
    `.trim();
  }
}