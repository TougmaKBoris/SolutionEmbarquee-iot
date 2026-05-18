import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UtilisateursService } from './utilisateurs.service';
import { Utilisateur } from './entities/utilisateur.entity';
import { Affectation } from '../affectations/entities/affectation.entity';

const mockModel = {
  find: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) }),
  findById: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) }),
  findByIdAndUpdate: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }) }),
  findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
  create: jest.fn().mockResolvedValue({}),
  deleteMany: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
};

describe('UtilisateursService', () => {
  let service: UtilisateursService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UtilisateursService,
        { provide: getModelToken(Utilisateur.name), useValue: mockModel },
        { provide: getModelToken(Affectation.name), useValue: mockModel },
      ],
    }).compile();
    service = module.get<UtilisateursService>(UtilisateursService);
  });

  it('should be defined', () => { expect(service).toBeDefined(); });
});
