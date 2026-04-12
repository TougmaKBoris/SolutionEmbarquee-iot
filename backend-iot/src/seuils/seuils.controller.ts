import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { SeuilsService } from './seuils.service';
import { UpdateSeuilDto } from './dto/update-seuil.dto';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('seuils')
@UseGuards(JwtGuard, RolesGuard)
export class SeuilsController {
  constructor(private readonly seuilsService: SeuilsService) {}

  @Get(':machineId')
  getByMachine(@Param('machineId') machineId: string) { return this.seuilsService.getByMachine(machineId); }

  @Put(':machineId/:typeCapteur') @Roles('admin')
  update(@Param('machineId') machineId: string, @Param('typeCapteur') typeCapteur: string, @Body() dto: UpdateSeuilDto) { return this.seuilsService.update(machineId, typeCapteur, dto); }
}
