import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SeuilDocument = Seuil & Document;

@Schema({ timestamps: true })
export class Seuil {
  @Prop({ type: Types.ObjectId, ref: 'Machine', required: true })
  machine_id: Types.ObjectId;

  @Prop({ required: true, enum: ['temperature', 'courant', 'vibration', 'pression'] })
  type_capteur: string;

  @Prop({ required: true })
  valeur_min: number;

  @Prop({ required: true })
  valeur_max: number;
}

export const SeuilSchema = SchemaFactory.createForClass(Seuil);
