import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CapteursService } from './capteurs.service';
import { JwtGuard } from '../common/guards/jwt.guard';

@Controller('capteurs')
@UseGuards(JwtGuard)
export class CapteursController {
  constructor(private readonly capteursService: CapteursService) {}

  @Get('live')
  getLive() { return this.capteursService.getLive(); }

  @Get('live/:machineId')
  getLiveByMachine(@Param('machineId') machineId: string) { return this.capteursService.getLiveByMachine(machineId); }

  @Get('historique/:machineId')
  getHistorique(@Param('machineId') machineId: string) { return this.capteursService.getHistorique(machineId); }

  @Get('historique/:machineId/:type')
  getHistoriqueByType(@Param('machineId') machineId: string, @Param('type') type: string) { return this.capteursService.getHistoriqueByType(machineId, type); }
}
