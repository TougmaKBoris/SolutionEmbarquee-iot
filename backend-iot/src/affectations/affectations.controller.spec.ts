import { Test, TestingModule } from '@nestjs/testing';
import { AffectationsController } from './affectations.controller';
import { AffectationsService } from './affectations.service';

describe('AffectationsController', () => {
  let controller: AffectationsController;

  const mockAffectationsService = {
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    remove: jest.fn().mockResolvedValue({ message: 'Affectation supprimee' }),
    getMaMachine: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AffectationsController],
      providers: [{ provide: AffectationsService, useValue: mockAffectationsService }],
    }).compile();
    controller = module.get<AffectationsController>(AffectationsController);
  });

  it('should be defined', () => { expect(controller).toBeDefined(); });
});
