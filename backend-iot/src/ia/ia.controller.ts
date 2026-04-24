import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { IaService } from './ia.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('ia')
@UseGuards(JwtGuard, RolesGuard)
@Roles('admin', 'responsable_maintenance')
export class IaController {
  constructor(private readonly iaService: IaService) {}

  @Get('analyse')
  getAnalyse() { return this.iaService.getAnalyse(); }

  @Get('tendances/:machineId')
  getTendances(@Param('machineId') machineId: string) { return this.iaService.getTendances(machineId); }

  @Get('historique-pannes')
  getHistoriquePannes() { return this.iaService.getHistoriquePannes(); }
}