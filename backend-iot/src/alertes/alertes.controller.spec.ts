import { Test, TestingModule } from '@nestjs/testing';
import { AlertesController } from './alertes.controller';
import { AlertesService } from './alertes.service';

describe('AlertesController', () => {
  let controller: AlertesController;

  const mockAlertesService = {
    findAll: jest.fn().mockResolvedValue([]),
    findNonResolues: jest.fn().mockResolvedValue([]),
    resoudre: jest.fn().mockResolvedValue({}),
    ignorer: jest.fn().mockResolvedValue({}),
    supprimer: jest.fn().mockResolvedValue({ message: 'Alerte supprimee' }),
    supprimerToutesNonResolues: jest.fn().mockResolvedValue({ message: '0 alertes supprimees' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertesController],
      providers: [{ provide: AlertesService, useValue: mockAlertesService }],
    }).compile();
    controller = module.get<AlertesController>(AlertesController);
  });

  it('should be defined', () => { expect(controller).toBeDefined(); });
});
