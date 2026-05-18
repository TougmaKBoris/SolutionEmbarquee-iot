import { Test, TestingModule } from '@nestjs/testing';
import { CapteursController } from './capteurs.controller';
import { CapteursService } from './capteurs.service';

describe('CapteursController', () => {
  let controller: CapteursController;

  const mockCapteursService = {
    getLive: jest.fn().mockReturnValue([]),
    getLiveByMachine: jest.fn().mockResolvedValue({ machine_id: 'id', capteurs: [] }),
    getHistorique: jest.fn().mockResolvedValue([]),
    getHistoriqueByType: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CapteursController],
      providers: [{ provide: CapteursService, useValue: mockCapteursService }],
    }).compile();
    controller = module.get<CapteursController>(CapteursController);
  });

  it('should be defined', () => { expect(controller).toBeDefined(); });
});
