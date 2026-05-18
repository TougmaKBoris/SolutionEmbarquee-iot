import { Test, TestingModule } from '@nestjs/testing';
import { MachinesController } from './machines.controller';
import { MachinesService } from './machines.service';

describe('MachinesController', () => {
  let controller: MachinesController;

  const mockMachinesService = {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    remove: jest.fn().mockResolvedValue({ message: 'Machine supprimee' }),
    changerMode: jest.fn().mockResolvedValue({}),
    arretUrgence: jest.fn().mockResolvedValue({}),
    redemarrer: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MachinesController],
      providers: [{ provide: MachinesService, useValue: mockMachinesService }],
    }).compile();
    controller = module.get<MachinesController>(MachinesController);
  });

  it('should be defined', () => { expect(controller).toBeDefined(); });
});
