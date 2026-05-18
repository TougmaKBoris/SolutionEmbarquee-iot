import { Test, TestingModule } from '@nestjs/testing';
import { IaController } from './ia.controller';
import { IaService } from './ia.service';

describe('IaController', () => {
  let controller: IaController;

  const mockIaService = {
    getAnalyse: jest.fn().mockResolvedValue({ mode: 'ia', analyses: [] }),
    getTendances: jest.fn().mockResolvedValue({ tendances: [] }),
    getHistoriquePannes: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IaController],
      providers: [{ provide: IaService, useValue: mockIaService }],
    }).compile();
    controller = module.get<IaController>(IaController);
  });

  it('should be defined', () => { expect(controller).toBeDefined(); });
});
