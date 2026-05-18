import { Test, TestingModule } from '@nestjs/testing';
import { UtilisateursController } from './utilisateurs.controller';
import { UtilisateursService } from './utilisateurs.service';

describe('UtilisateursController', () => {
  let controller: UtilisateursController;

  const mockUtilisateursService = {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    remove: jest.fn().mockResolvedValue({ message: 'Utilisateur supprime' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UtilisateursController],
      providers: [{ provide: UtilisateursService, useValue: mockUtilisateursService }],
    }).compile();
    controller = module.get<UtilisateursController>(UtilisateursController);
  });

  it('should be defined', () => { expect(controller).toBeDefined(); });
});
