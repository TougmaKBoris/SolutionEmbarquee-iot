import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MachineSupprimeeDocument = MachineSupprimee & Document;

@Schema({ timestamps: true })
export class MachineSupprimee {
  @Prop({ required: true, unique: true })
  nom: string;
}

export const MachineSupprimeeSchema = SchemaFactory.createForClass(MachineSupprimee);
