import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EvenementsService } from './evenements.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('evenements')
@UseGuards(JwtGuard, RolesGuard)
export class EvenementsController {
  constructor(private readonly evenementsService: EvenementsService) {}

  @Get()
  @Roles('admin', 'responsable_maintenance')
  findAll(
    @Query('machine_id') machineId?: string,
    @Query('periode') periode?: string,
    @Query('type') type?: string,
  ) {
    return this.evenementsService.findAll({ machine_id: machineId, periode, type });
  }
}