import { Controller, Get, Patch, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AlertesService } from './alertes.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('alertes')
@UseGuards(JwtGuard)
export class AlertesController {
  constructor(private readonly alertesService: AlertesService) {}

  @Get()
  findAll() { return this.alertesService.findAll(); }

  @Get('non-resolues')
  findNonResolues(@Query('machineId') machineId?: string) { return this.alertesService.findNonResolues(machineId); }

  @Delete('purge')
  @UseGuards(RolesGuard)
  @Roles('admin')
  purge() { return this.alertesService.supprimerToutesNonResolues(); }

  @Patch(':id/resoudre')
  @UseGuards(RolesGuard)
  @Roles('admin', 'responsable_maintenance')
  resoudre(@Param('id') id: string, @Req() req: any) {
    const utilisateur = {
      id: req.user?.sub || req.user?.id,
      nom: req.user?.nom || 'Utilisateur',
      role: req.user?.role || 'inconnu',
    };
    return this.alertesService.resoudre(id, utilisateur);
  }

  @Patch(':id/ignorer')
  @UseGuards(RolesGuard)
  @Roles('admin', 'responsable_maintenance')
  ignorer(@Param('id') id: string, @Req() req: any) {
    const utilisateur = {
      id: req.user?.sub || req.user?.id,
      nom: req.user?.nom || 'Utilisateur',
      role: req.user?.role || 'inconnu',
    };
    return this.alertesService.ignorer(id, utilisateur);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'responsable_maintenance')
  supprimer(@Param('id') id: string) { return this.alertesService.supprimer(id); }
}