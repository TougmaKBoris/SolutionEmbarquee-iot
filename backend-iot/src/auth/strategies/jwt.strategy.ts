import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Utilisateur, UtilisateurDocument } from '../../utilisateurs/entities/utilisateur.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(Utilisateur.name) private utilisateurModel: Model<UtilisateurDocument>,
    config: ConfigService,
  ) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET manquant dans les variables d\'environnement');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const user = await this.utilisateurModel.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Utilisateur non trouve');
    return { userId: payload.sub, email: payload.email, role: payload.role, nom: payload.nom };
  }
}
