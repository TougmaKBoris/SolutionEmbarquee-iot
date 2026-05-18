import { Test, TestingModule } from '@nestjs/testing';
import { SeuilsController } from './seuils.controller';
import { SeuilsService } from './seuils.service';

describe('SeuilsController', () => {
  let controller: SeuilsController;

  const mockSeuilsService = {
    getByMachine: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeuilsController],
      providers: [{ provide: SeuilsService, useValue: mockSeuilsService }],
    }).compile();
    controller = module.get<SeuilsController>(SeuilsController);
  });

  it('should be defined', () => { expect(controller).toBeDefined(); });
});
