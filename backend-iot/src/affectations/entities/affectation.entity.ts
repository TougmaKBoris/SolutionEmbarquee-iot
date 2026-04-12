import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AffectationDocument = Affectation & Document;

@Schema({ timestamps: true })
export class Affectation {
  @Prop({ type: Types.ObjectId, ref: 'Utilisateur', required: true })
  operateur_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Machine', required: true })
  machine_id: Types.ObjectId;
}

export const AffectationSchema = SchemaFactory.createForClass(Affectation);
