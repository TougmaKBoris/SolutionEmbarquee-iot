import { Test, TestingModule } from '@nestjs/testing';
import { MachinesController } from './machines.controller';
import { MachinesService } from './machines.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';

const mockMachinesService = {
  findAll: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue({}),
  remove: jest.fn().mockResolvedValue({}),
  changerMode: jest.fn().mockResolvedValue({}),
  arretUrgence: jest.fn().mockResolvedValue({}),
  redemarrer: jest.fn().mockResolvedValue({}),
};

describe('MachinesController', () => {
  let controller: MachinesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MachinesController],
      providers: [{ provide: MachinesService, useValue: mockMachinesService }],
    })
      .overrideGuard(JwtGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MachinesController>(MachinesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll retourne la liste des machines', async () => {
    const result = await controller.findAll();
    expect(mockMachinesService.findAll).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('findOne retourne une machine par id', async () => {
    await controller.findOne('abc123');
    expect(mockMachinesService.findOne).toHaveBeenCalledWith('abc123');
  });

  it('create cree une machine', async () => {
    const dto: any = { nom: 'Machine Test', capteurs: ['temperature'] };
    await controller.create(dto);
    expect(mockMachinesService.create).toHaveBeenCalledWith(dto);
  });

  it('remove supprime une machine', async () => {
    await controller.remove('abc123');
    expect(mockMachinesService.remove).toHaveBeenCalledWith('abc123');
  });

  it('arretUrgence declenche un arret d urgence', async () => {
    const req: any = { user: { userId: 'u1', nom: 'Admin', role: 'admin' } };
    await controller.arretUrgence('abc123', req);
    expect(mockMachinesService.arretUrgence).toHaveBeenCalledWith('abc123', {
      id: 'u1', nom: 'Admin', role: 'admin',
    });
  });

  it('redemarrer redémarre une machine', async () => {
    const req: any = { user: { userId: 'u1', nom: 'Admin', role: 'admin' } };
    await controller.redemarrer('abc123', req);
    expect(mockMachinesService.redemarrer).toHaveBeenCalledWith('abc123', {
      id: 'u1', nom: 'Admin', role: 'admin',
    });
  });
});
