import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Utilisateur, UtilisateurDocument } from '../utilisateurs/entities/utilisateur.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Utilisateur.name) private utilisateurModel: Model<UtilisateurDocument>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.utilisateurModel.findOne({ email: loginDto.email });
    if (!user) throw new UnauthorizedException('Email ou mot de passe incorrect');

    const isMatch = await bcrypt.compare(loginDto.mot_de_passe, user.mot_de_passe);
    if (!isMatch) throw new UnauthorizedException('Email ou mot de passe incorrect');

    const payload = { sub: user._id, email: user.email, role: user.role, nom: user.nom };

    return {
      jeton: this.jwtService.sign(payload),
      utilisateur: { id: user._id, email: user.email, nom: user.nom, role: user.role },
    };
  }
}
