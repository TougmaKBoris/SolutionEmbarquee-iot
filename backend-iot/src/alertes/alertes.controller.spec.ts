import { Test, TestingModule } from '@nestjs/testing';
import { AlertesController } from './alertes.controller';

describe('AlertesController', () => {
  let controller: AlertesController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ controllers: [AlertesController] }).compile();
    controller = module.get<AlertesController>(AlertesController);
  });
  it('should be defined', () => { expect(controller).toBeDefined(); });
});
