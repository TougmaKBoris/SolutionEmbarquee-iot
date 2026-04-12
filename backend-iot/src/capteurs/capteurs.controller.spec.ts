import { Test, TestingModule } from '@nestjs/testing';
import { CapteursController } from './capteurs.controller';

describe('CapteursController', () => {
  let controller: CapteursController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ controllers: [CapteursController] }).compile();
    controller = module.get<CapteursController>(CapteursController);
  });
  it('should be defined', () => { expect(controller).toBeDefined(); });
});
