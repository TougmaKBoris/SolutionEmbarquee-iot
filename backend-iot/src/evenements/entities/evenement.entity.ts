import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EvenementDocument = Evenement & Document;

@Schema({ timestamps: true })
export class Evenement {
  @Prop({
    required: true,
    enum: ['arret_urgence', 'redemarrage', 'changement_mode', 'alerte_resolue', 'commande_actionneur'],
  })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'Machine', required: true })
  machine_id: Types.ObjectId;

  @Prop({ required: true })
  machine_nom: string;

  @Prop({ default: null })
  utilisateur_id: string;

  @Prop({ default: 'Systeme' })
  utilisateur_nom: string;

  @Prop({ default: 'systeme' })
  utilisateur_role: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const EvenementSchema = SchemaFactory.createForClass(Evenement);