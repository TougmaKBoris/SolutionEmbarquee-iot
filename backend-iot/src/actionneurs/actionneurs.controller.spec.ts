import { Test, TestingModule } from '@nestjs/testing';
import { ActionneursController } from './actionneurs.controller';

describe('ActionneursController', () => {
  let controller: ActionneursController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ controllers: [ActionneursController] }).compile();
    controller = module.get<ActionneursController>(ActionneursController);
  });
  it('should be defined', () => { expect(controller).toBeDefined(); });
});
