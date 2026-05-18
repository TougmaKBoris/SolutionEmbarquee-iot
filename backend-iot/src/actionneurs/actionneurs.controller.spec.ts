import { Test, TestingModule } from '@nestjs/testing';
import { ActionneursController } from './actionneurs.controller';
import { ActionneursService } from './actionneurs.service';

describe('ActionneursController', () => {
  let controller: ActionneursController;

  const mockActionneursService = {
    getByMachine: jest.fn().mockResolvedValue([]),
    commande: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActionneursController],
      providers: [{ provide: ActionneursService, useValue: mockActionneursService }],
    }).compile();
    controller = module.get<ActionneursController>(ActionneursController);
  });

  it('should be defined', () => { expect(controller).toBeDefined(); });
});
