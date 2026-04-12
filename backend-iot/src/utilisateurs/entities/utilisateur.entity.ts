import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UtilisateurDocument = Utilisateur & Document;

@Schema({ timestamps: true })
export class Utilisateur {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  mot_de_passe: string;

  @Prop({ required: true })
  nom: string;

  @Prop({ required: true, enum: ['admin', 'responsable_maintenance', 'operateur'] })
  role: string;
}

export const UtilisateurSchema = SchemaFactory.createForClass(Utilisateur);
