import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ActionneurDocument = Actionneur & Document;

@Schema({ timestamps: true })
export class Actionneur {
  @Prop({ type: Types.ObjectId, ref: 'Machine', required: true })
  machine_id: Types.ObjectId;

  @Prop({ required: true })
  type: string;

  @Prop({ default: false })
  etat: boolean;

  @Prop({ default: null })
  derniere_commande: Date;
}

export const ActionneurSchema = SchemaFactory.createForClass(Actionneur);
