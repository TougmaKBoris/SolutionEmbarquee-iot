import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UtilisateursService } from './utilisateurs.service';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('utilisateurs')
@UseGuards(JwtGuard, RolesGuard)
@Roles('admin')
export class UtilisateursController {
  constructor(private readonly utilisateursService: UtilisateursService) {}

  @Get()
  findAll() { return this.utilisateursService.findAll(); }

  @Post()
  create(@Body() dto: CreateUtilisateurDto) { return this.utilisateursService.create(dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.utilisateursService.remove(id); }
}
