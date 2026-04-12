import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { MachinesService } from './machines.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('machines')
@UseGuards(JwtGuard, RolesGuard)
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get()
  findAll() { return this.machinesService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.machinesService.findOne(id); }

  @Post() @Roles('admin')
  create(@Body() dto: CreateMachineDto) { return this.machinesService.create(dto); }

  @Put(':id') @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateMachineDto) { return this.machinesService.update(id, dto); }

  @Delete(':id') @Roles('admin')
  remove(@Param('id') id: string) { return this.machinesService.remove(id); }

  @Patch(':id/mode') @Roles('admin', 'responsable_maintenance')
  changerMode(@Param('id') id: string, @Body('mode') mode: string, @Req() req: any) {
    const utilisateur = {
      id: req.user?.sub || req.user?.id,
      nom: req.user?.nom || 'Utilisateur',
      role: req.user?.role || 'inconnu',
    };
    return this.machinesService.changerMode(id, mode, utilisateur);
  }

  @Post(':id/arret-urgence')
  arretUrgence(@Param('id') id: string, @Req() req: any) {
    const utilisateur = {
      id: req.user?.sub || req.user?.id,
      nom: req.user?.nom || 'Utilisateur inconnu',
      role: req.user?.role || 'inconnu',
    };
    return this.machinesService.arretUrgence(id, utilisateur);
  }

  @Post(':id/redemarrer') @Roles('admin', 'responsable_maintenance')
  redemarrer(@Param('id') id: string, @Req() req: any) {
    const utilisateur = {
      id: req.user?.sub || req.user?.id,
      nom: req.user?.nom || 'Utilisateur',
      role: req.user?.role || 'inconnu',
    };
    return this.machinesService.redemarrer(id, utilisateur);
  }
}