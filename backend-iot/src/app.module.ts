import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { MachinesModule } from './machines/machines.module';
import { CapteursModule } from './capteurs/capteurs.module';
import { ActionneursModule } from './actionneurs/actionneurs.module';
import { UtilisateursModule } from './utilisateurs/utilisateurs.module';
import { AffectationsModule } from './affectations/affectations.module';
import { AlertesModule } from './alertes/alertes.module';
import { SeuilsModule } from './seuils/seuils.module';
import { IaModule } from './ia/ia.module';
import { InitialisationModule } from './common/initialisation/initialisation.module';
import { EvenementsModule } from './evenements/evenements.module';
import { EmailsModule } from './emails/emails.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    ScheduleModule.forRoot(),
    AuthModule,
    MachinesModule,
    CapteursModule,
    ActionneursModule,
    UtilisateursModule,
    AffectationsModule,
    AlertesModule,
    SeuilsModule,
    IaModule,
   InitialisationModule,
   EvenementsModule,
   EmailsModule,
  ],
})
export class AppModule {}
