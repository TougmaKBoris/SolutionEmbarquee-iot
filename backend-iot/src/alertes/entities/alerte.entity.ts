import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AlerteDocument = Alerte & Document;

@Schema({ timestamps: true })
export class Alerte {
  @Prop({ type: Types.ObjectId, ref: 'Machine', required: true })
  machine_id: Types.ObjectId;

  @Prop({ required: true })
  type_capteur: string;

  @Prop({ required: true })
  valeur: number;

  @Prop({ required: true })
  seuil_depasse: number;

  @Prop({ required: true, enum: ['attention', 'critique', 'ignoree'] })
  niveau: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  resolue: boolean;

  @Prop({ default: null })
  resolue_le: Date;

  @Prop({ default: false })
  email_envoye: boolean;
}

export const AlerteSchema = SchemaFactory.createForClass(Alerte);
