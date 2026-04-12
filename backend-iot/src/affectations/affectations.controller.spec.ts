import { Test, TestingModule } from '@nestjs/testing';
import { AffectationsController } from './affectations.controller';

describe('AffectationsController', () => {
  let controller: AffectationsController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ controllers: [AffectationsController] }).compile();
    controller = module.get<AffectationsController>(AffectationsController);
  });
  it('should be defined', () => { expect(controller).toBeDefined(); });
});
