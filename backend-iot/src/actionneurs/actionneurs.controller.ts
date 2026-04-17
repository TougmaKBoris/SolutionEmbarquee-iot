import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ActionneursService } from './actionneurs.service';
import { CommandeActionneurDto } from './dto/commande-actionneur.dto';
import { JwtGuard } from '../common/guards/jwt.guard';

@Controller('actionneurs')
@UseGuards(JwtGuard)
export class ActionneursController {
  constructor(private readonly actionneursService: ActionneursService) {}

  @Get(':machineId')
  getByMachine(@Param('machineId') machineId: string) { return this.actionneursService.getByMachine(machineId); }

  @Post(':machineId/commande')
  commande(@Param('machineId') machineId: string, @Body() dto: CommandeActionneurDto, @Req() req: any) {
    const utilisateur = { userId: req.user?.userId, nom: req.user?.nom, role: req.user?.role };
    return this.actionneursService.commande(machineId, dto, utilisateur);
  }
}
