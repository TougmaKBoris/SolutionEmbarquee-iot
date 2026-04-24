import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MachineDocument = Machine & Document;

@Schema({ timestamps: true })
export class Machine {
  @Prop({ required: true })
  nom: string;

  @Prop({ unique: true, required: true, index: true })
  code: string;

  @Prop({ type: [String], default: [] })
  capteurs: string[];

  @Prop({ type: [String], default: [] })
  actionneurs: string[];

  @Prop({ default: 'en_ligne', enum: ['en_ligne', 'hors_ligne'] })
  statut: string;

  @Prop({ default: 'auto', enum: ['auto', 'manuel'] })
  mode: string;

  @Prop({ default: 'en_marche', enum: ['en_marche', 'arretee'] })
  etat: string;

  @Prop({ default: 'simulation', enum: ['simulation', 'mqtt'] })
  source: string;
}

export const MachineSchema = SchemaFactory.createForClass(Machine);