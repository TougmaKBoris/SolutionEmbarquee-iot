import { Test, TestingModule } from '@nestjs/testing';
import { SeuilsController } from './seuils.controller';

describe('SeuilsController', () => {
  let controller: SeuilsController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ controllers: [SeuilsController] }).compile();
    controller = module.get<SeuilsController>(SeuilsController);
  });
  it('should be defined', () => { expect(controller).toBeDefined(); });
});
