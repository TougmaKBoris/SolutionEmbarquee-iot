import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { AffectationsService } from './affectations.service';
import { CreateAffectationDto } from './dto/create-affectation.dto';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('affectations')
@UseGuards(JwtGuard, RolesGuard)
export class AffectationsController {
  constructor(private readonly affectationsService: AffectationsService) {}

  @Get() @Roles('admin', 'responsable_maintenance')
  findAll() { return this.affectationsService.findAll(); }

  @Post() @Roles('admin')
  create(@Body() dto: CreateAffectationDto) { return this.affectationsService.create(dto); }

  @Delete(':id') @Roles('admin')
  remove(@Param('id') id: string) { return this.affectationsService.remove(id); }

  @Get('ma-machine') @Roles('operateur')
  getMaMachine(@Req() req) { return this.affectationsService.getMaMachine(req.user.userId); }
}