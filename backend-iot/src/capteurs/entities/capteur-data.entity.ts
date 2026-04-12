import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CapteurDataDocument = CapteurData & Document;

@Schema({ timestamps: true })
export class CapteurData {
  @Prop({ type: Types.ObjectId, ref: 'Machine', required: true })
  machine_id: Types.ObjectId;

  @Prop({ required: true, enum: ['temperature', 'courant', 'vibration', 'pression'] })
  type: string;

  @Prop({ required: true })
  valeur: number;

  @Prop({ required: true })
  unite: string;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const CapteurDataSchema = SchemaFactory.createForClass(CapteurData);
